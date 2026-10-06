/**
 * Encomendas (RF01, RF02, RF03), no backend simulado.
 *
 * O servico so orquestra. Validacao e montagem do pedido estao em domain/orders, deteccao da
 * transportadora no CarrierDetector, anomalias no AnomalyDetector, persistencia no
 * IOrderRepository, e a "consulta a transportadora" no ICarrierTrackingGateway. Todas essas
 * pecas chegam pelo construtor (DIP), montadas no composition root.
 *
 * Na versao anterior este arquivo tambem simulava a transportadora (nextEvent), calculava
 * datas (inDays), mexia direto no store global e ainda respondia o status dos workers, que
 * nada tem a ver com encomendas (SRP).
 *
 * Todo acesso filtra por `tenantId`. Num backend real esse filtro viria do token e seria
 * aplicado no banco; deixar a filtragem so no cliente nao isola nada de verdade. Aqui ele
 * documenta a regra do RF10 e a torna verificavel na apresentacao.
 */

import type { AnomalyDetector } from '../../domain/anomalies/AnomalyDetector';
import type { CarrierDetector } from '../../domain/carriers/CarrierDetector';
import {
  buildNewOrder,
  normalizeNewOrder,
  validateNewOrder,
  type NewOrderInput,
} from '../../domain/orders/newOrder';
import type { ApiResponse, Order, OrderWithAnomalies, TenantId } from '../../types';
import type { IOrdersService } from '../contracts';
import type { ICarrierTrackingGateway, IOrderRepository, IWorkerActivityRecorder } from './ports';
import type { SimulatedNetwork } from './SimulatedNetwork';

export interface OrdersServiceDeps {
  orders: IOrderRepository;
  tracking: ICarrierTrackingGateway;
  workers: IWorkerActivityRecorder;
  anomalies: AnomalyDetector;
  carriers: CarrierDetector;
  network: SimulatedNetwork;
}

export class SimulatedOrdersService implements IOrdersService {
  private readonly deps: OrdersServiceDeps;

  constructor(deps: OrdersServiceDeps) {
    this.deps = deps;
  }

  async list(tenantId: TenantId): Promise<ApiResponse<OrderWithAnomalies[]>> {
    const orders = this.deps.orders.listByTenant(tenantId).map((o) => this.enrich(o));
    return this.deps.network.ok(orders);
  }

  async get(tenantId: TenantId, code: string): Promise<ApiResponse<OrderWithAnomalies>> {
    const order = this.deps.orders.findByCode(tenantId, code);
    if (!order) return this.notFound(code);
    return this.deps.network.ok(this.enrich(order));
  }

  /** Cadastro manual de encomenda (RF01). */
  async create(
    tenantId: TenantId,
    input: NewOrderInput,
  ): Promise<ApiResponse<OrderWithAnomalies>> {
    const { orders, carriers, workers, network } = this.deps;

    const clean = normalizeNewOrder(input);
    const carrier = carriers.detect(clean.code);
    const isDuplicate = orders.findByCode(tenantId, clean.code) !== null;

    const error = validateNewOrder(clean, carrier, isDuplicate);
    if (error || !carrier) {
      return network.fail(error?.message ?? 'Cadastro inválido.', error ? [error.detail] : []);
    }

    const order = buildNewOrder(tenantId, clean, carrier);
    orders.add(order);
    workers.enqueue();

    return network.ok(
      this.enrich(order),
      `Pedido cadastrado · ${carrier} identificada · consulta agendada`,
    );
  }

  /**
   * Consulta de status sob demanda (RF02).
   *
   * No sistema real quem faz isso e um worker, periodicamente e em segundo plano. O botao existe
   * para tornar visivel numa apresentacao um processo que normalmente ninguem ve.
   */
  async refresh(tenantId: TenantId, code: string): Promise<ApiResponse<OrderWithAnomalies>> {
    const { orders, tracking, workers, network } = this.deps;

    const order = orders.findByCode(tenantId, code);
    if (!order) return this.notFound(code);

    workers.recordSync(new Date());

    if (order.status === 'Entregue') {
      return network.ok(this.enrich(order), 'Encomenda já entregue — sem novas movimentações.');
    }

    const update = tracking.fetchUpdate(order);
    if (!update) {
      return network.ok(this.enrich(order), 'Nenhuma movimentação nova desde a última consulta.');
    }

    const updated: Order = {
      ...order,
      status: update.status,
      timeline: [update.event, ...order.timeline],
    };
    orders.update(updated);

    return network.ok(this.enrich(updated), `Movimentação nova: ${update.event.title}`);
  }

  /** Acrescenta a cada encomenda o que as regras de dominio derivaram dela. */
  private enrich(order: Order): OrderWithAnomalies {
    const anomalies = this.deps.anomalies.detect(order);
    return { ...order, anomalies, hasAnomaly: anomalies.length > 0 };
  }

  private notFound(code: string) {
    return this.deps.network.fail('Encomenda não encontrada.', [
      `Nenhuma encomenda com o código ${code}.`,
    ]);
  }
}

/**
 * Encomendas (RF01, RF02, RF03).
 *
 * Esta e a fronteira que sera trocada quando o backend existir. Cada funcao daqui vira uma
 * chamada HTTP, e nenhuma tela precisa mudar, porque todas leem o mesmo envelope.
 *
 * Todo acesso filtra por `tenantId`. Num backend real esse filtro viria do token e seria
 * aplicado no banco — deixar a filtragem so no cliente nao isola nada de verdade. Aqui ele
 * documenta a regra do RF10 e a torna verificavel na apresentacao.
 */

import { detectAnomalies } from '../lib/anomalyRules';
import { detectCarrier, normalizeCode } from '../lib/carrierDetection';
import type { ApiResponse, Order, OrderWithAnomalies, TenantId } from '../types';
import { clone, fail, ok } from './client';
import { store } from './store';

/** Acrescenta a cada encomenda o que as regras de dominio derivaram dela. */
function enrich(order: Order): OrderWithAnomalies {
  const anomalies = detectAnomalies(order);
  return { ...order, anomalies, hasAnomaly: anomalies.length > 0 };
}

function byTenant(tenantId: TenantId): Order[] {
  return store.orders.filter((o) => o.tenantId === tenantId);
}

/** Todas as encomendas da empresa, ja analisadas. */
export async function listOrders(
  tenantId: TenantId,
): Promise<ApiResponse<OrderWithAnomalies[]>> {
  const orders = byTenant(tenantId).map(enrich);
  return ok(clone(orders));
}

export async function getOrder(
  tenantId: TenantId,
  code: string,
): Promise<ApiResponse<OrderWithAnomalies | null>> {
  const order = byTenant(tenantId).find((o) => o.code === code);

  if (!order) {
    return fail('Encomenda não encontrada.', [`Nenhuma encomenda com o código ${code}.`]);
  }

  return ok(clone(enrich(order)));
}

export interface NewOrderInput {
  code: string;
  recipient: string;
  city: string;
}

/**
 * Cadastro manual de encomenda (RF01).
 *
 * A transportadora nao e escolhida pelo usuario, e deduzida do codigo. Essa e a diferenca
 * que o requisito pede: quem cadastra cola o codigo e o sistema resolve o resto.
 */
export async function createOrder(
  tenantId: TenantId,
  input: NewOrderInput,
): Promise<ApiResponse<OrderWithAnomalies | null>> {
  const code = normalizeCode(input.code);
  const recipient = input.recipient.trim();
  const city = input.city.trim();

  const carrier = detectCarrier(code);
  if (!carrier) {
    return fail('Código não reconhecido.', [
      'Informe um código válido de uma transportadora integrada.',
    ]);
  }

  if (!recipient) {
    return fail('Destinatário obrigatório.', ['Informe o destinatário.']);
  }

  // A unicidade vale por empresa, nao globalmente: duas empresas podem legitimamente rastrear
  // codigos distintos que colidam, e nenhuma delas deve saber da existencia da outra.
  if (byTenant(tenantId).some((o) => o.code === code)) {
    return fail('Código duplicado.', ['Este código já está cadastrado.']);
  }

  const order: Order = {
    code,
    tenantId,
    carrier,
    recipient,
    city: city || '—',
    region: 'Sudeste',
    // Prazo provisorio. A transportadora devolve o prazo real na primeira consulta.
    dueAt: inDays(7),
    origin: city || 'São Paulo, SP',
    plannedRoute: [],
    timeline: [
      {
        title: 'Cadastrado — aguardando primeira consulta à API',
        place: carrier,
        at: new Date().toISOString(),
        rawCode: 'LOCAL',
      },
    ],
    status: 'Postado',
  };

  store.orders.unshift(order);
  store.queueSize += 1;

  return ok(
    clone(enrich(order)),
    `Pedido cadastrado · ${carrier} identificada · consulta agendada`,
  );
}

/**
 * Consulta de status sob demanda (RF02).
 *
 * No sistema real quem faz isso e um worker, periodicamente e em segundo plano. O botao existe
 * para tornar visivel numa apresentacao um processo que normalmente ninguem ve.
 */
export async function refreshOrder(
  tenantId: TenantId,
  code: string,
): Promise<ApiResponse<OrderWithAnomalies | null>> {
  const order = store.orders.find((o) => o.tenantId === tenantId && o.code === code);

  if (!order) {
    return fail('Encomenda não encontrada.', [`Nenhuma encomenda com o código ${code}.`]);
  }

  store.lastSyncAt = new Date().toISOString();

  if (order.status === 'Entregue') {
    return ok(clone(enrich(order)), 'Encomenda já entregue — sem novas movimentações.');
  }

  const next = nextEvent(order);
  if (!next) {
    return ok(clone(enrich(order)), 'Nenhuma movimentação nova desde a última consulta.');
  }

  order.timeline.unshift(next.event);
  order.status = next.status;

  return ok(clone(enrich(order)), `Movimentação nova: ${next.event.title}`);
}

/**
 * Proximo passo plausivel para a encomenda.
 *
 * Percorre a rota planejada e avanca uma parada por consulta, ate a entrega. Nao pretende
 * simular a operacao real, apenas produzir uma sequencia coerente para a demonstracao.
 */
function nextEvent(order: Order): { event: Order['timeline'][number]; status: Order['status'] } | null {
  const at = new Date().toISOString();
  const visited = new Set(order.timeline.map((e) => e.place));
  const remaining = order.plannedRoute.filter((place) => !visited.has(place));

  if (order.status === 'Saiu p/ entrega') {
    return {
      event: { title: 'Entregue', place: order.city, at, rawCode: 'DLV' },
      status: 'Entregue',
    };
  }

  if (remaining.length === 0 || remaining[remaining.length - 1] === order.city) {
    if (visited.has(order.city)) {
      return {
        event: { title: 'Saiu para entrega', place: order.city, at, rawCode: 'OUT' },
        status: 'Saiu p/ entrega',
      };
    }
    return {
      event: { title: 'Chegada na unidade de destino', place: order.city, at, rawCode: 'ARR' },
      status: 'Em trânsito',
    };
  }

  return {
    event: { title: 'Objeto em trânsito', place: remaining[0], at, rawCode: 'TRN' },
    status: 'Em trânsito',
  };
}

function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

/** Momento da ultima consulta e tamanho da fila, exibidos na barra lateral. */
export async function getWorkerStatus(): Promise<
  ApiResponse<{ lastSyncAt: string; queueSize: number }>
> {
  return ok({ lastSyncAt: store.lastSyncAt, queueSize: store.queueSize });
}

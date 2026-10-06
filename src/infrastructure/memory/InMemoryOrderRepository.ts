/**
 * Encomendas em memoria, no lugar do banco de dados.
 *
 * Substitui a fatia `orders` do antigo store global. Recebe os dados iniciais pelo construtor,
 * entao nao importa mocks/: quem decide com o que semear e o composition root.
 *
 * Vive fora dos componentes de proposito. Se este estado morasse num contexto do React, cada
 * remontagem de tela o reiniciaria. O preco e que os dados voltam ao estado inicial quando a
 * pagina e recarregada, o que e aceitavel para uma entrega de frontend.
 */

import type { IOrderRepository } from '../../services/simulated/ports';
import type { Order, TenantId } from '../../types';

export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Order[];

  constructor(seed: readonly Order[]) {
    this.orders = structuredClone([...seed]);
  }

  listByTenant(tenantId: TenantId): Order[] {
    return this.orders.filter((o) => o.tenantId === tenantId);
  }

  findByCode(tenantId: TenantId, code: string): Order | null {
    return this.orders.find((o) => o.tenantId === tenantId && o.code === code) ?? null;
  }

  /** Cadastros novos entram no topo, como a lista exibe. */
  add(order: Order): void {
    this.orders = [order, ...this.orders];
  }

  update(order: Order): void {
    this.orders = this.orders.map((o) =>
      o.tenantId === order.tenantId && o.code === order.code ? order : o,
    );
  }
}

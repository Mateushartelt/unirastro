/**
 * Filtros e busca da lista de encomendas.
 *
 * Estavam embutidos no corpo da OrdersPage, que tambem carregava dados, controlava gaveta,
 * modal e acoes. Como funcao pura, a regra de filtragem e testavel sem renderizar nada.
 */

import type { OrderStatus, OrderWithAnomalies } from '../../types';

/** Filtros da barra. "Com anomalia" nao e um status, e um recorte sobre qualquer status. */
export const ORDER_FILTERS = [
  'Todas',
  'Com anomalia',
  'Em trânsito',
  'Parado',
  'Entrega frustrada',
  'Entregue',
] as const;

export type OrderFilter = (typeof ORDER_FILTERS)[number];

function matchesFilter(order: OrderWithAnomalies, filter: OrderFilter): boolean {
  if (filter === 'Todas') return true;
  if (filter === 'Com anomalia') return order.hasAnomaly;
  return order.status === (filter as OrderStatus);
}

function matchesQuery(order: OrderWithAnomalies, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return (
    order.code.toLowerCase().includes(q) ||
    order.recipient.toLowerCase().includes(q) ||
    order.city.toLowerCase().includes(q)
  );
}

export function filterOrders(
  orders: readonly OrderWithAnomalies[],
  filter: OrderFilter,
  query: string,
): OrderWithAnomalies[] {
  return orders.filter((o) => matchesFilter(o, filter) && matchesQuery(o, query));
}

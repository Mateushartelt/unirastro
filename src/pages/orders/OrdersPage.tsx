import { useMemo, useState } from 'react';
import { KpiRow } from '../../components/orders/KpiRow';
import { NewOrderModal } from '../../components/orders/NewOrderModal';
import { OrderDrawer } from '../../components/orders/OrderDrawer';
import { OrderFilters } from '../../components/orders/OrderFilters';
import { OrderTable } from '../../components/orders/OrderTable';
import { filterOrders, type OrderFilter } from '../../components/orders/orderFilters';
import { AsyncContent } from '../../components/ui/AsyncContent';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { useServices } from '../../composition/servicesContext';
import { useAuth, useSession } from '../../contexts/AuthContext';
import { useServiceQuery } from '../../hooks/useServiceQuery';
import type { OrderWithAnomalies } from '../../types';
import styles from './OrdersPage.module.css';
import { useNewOrderForm, useOrderRefresh } from './useOrderActions';
import { useSelectedOrder } from './useSelectedOrder';

const NO_ORDERS: OrderWithAnomalies[] = [];

/**
 * Tela de encomendas (RF01, RF02, RF03).
 *
 * Recebe o IOrdersService por injecao. O carregamento foi para useServiceQuery, a filtragem
 * para orderFilters.ts, a gaveta para useSelectedOrder e as acoes para useOrderActions; aqui
 * sobra a composicao da tela.
 */
export function OrdersPage() {
  const session = useSession();
  const { can } = useAuth();
  const { orders: ordersService } = useServices();
  const { data: orders, loading, error } = useServiceQuery(
    () => ordersService.list(session.tenantId),
    session.tenantId,
    NO_ORDERS,
  );

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<OrderFilter>('Todas');
  const visible = useMemo(() => filterOrders(orders, filter, query), [orders, filter, query]);

  const drawer = useSelectedOrder(orders);
  const { refreshing, refresh } = useOrderRefresh(drawer.selectedCode);
  const form = useNewOrderForm(() => {
    setFilter('Todas');
    setQuery('');
  });

  return (
    <>
      <PageHeader
        eyebrow="Gestão de encomendas"
        title="Encomendas em trânsito"
        action={can.createOrders && <Button onClick={form.openForm}>+ Cadastrar pedido</Button>}
      />

      <AsyncContent loading={loading} error={error} loadingMessage="Carregando encomendas…">
        <KpiRow orders={orders} />
        <OrderFilters
          orders={orders}
          query={query}
          filter={filter}
          onQueryChange={setQuery}
          onFilterChange={setFilter}
        />
        <OrderTable orders={visible} onSelect={drawer.select} />
        <p className={styles.summary}>
          {visible.length} de {orders.length} encomendas · {session.tenantName}
        </p>
      </AsyncContent>

      <OrderDrawer
        order={drawer.selected}
        // Enquanto a lista carrega, um link direto ainda nao tem o que mostrar: a gaveta abre
        // em estado de espera em vez de piscar vazia.
        loading={loading && drawer.selectedCode !== null}
        refreshing={refreshing}
        onClose={() => drawer.select(null)}
        onRefresh={refresh}
      />

      <NewOrderModal
        key={form.formKey}
        open={form.open}
        submitting={form.submitting}
        serverError={form.error}
        onClose={form.close}
        onSubmit={form.submit}
      />
    </>
  );
}

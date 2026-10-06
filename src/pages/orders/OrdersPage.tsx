import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KpiRow } from '../../components/orders/KpiRow';
import { NewOrderModal } from '../../components/orders/NewOrderModal';
import { OrderDrawer } from '../../components/orders/OrderDrawer';
import { OrderTable } from '../../components/orders/OrderTable';
import {
  filterOrders,
  ORDER_FILTERS,
  type OrderFilter,
} from '../../components/orders/orderFilters';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { ErrorState, LoadingState } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { useServices } from '../../composition/servicesContext';
import { useAuth, useSession } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import type { NewOrderInput } from '../../domain/orders/newOrder';
import { useServiceQuery } from '../../hooks/useServiceQuery';
import { responseMessage } from '../../services/response';
import type { OrderWithAnomalies } from '../../types';
import styles from './OrdersPage.module.css';

const NO_ORDERS: OrderWithAnomalies[] = [];

/**
 * Tela de encomendas (RF01, RF02, RF03).
 *
 * Recebe o IOrdersService por injecao. O carregamento foi para useServiceQuery e a filtragem
 * para orderFilters.ts; aqui sobra a coordenacao da tela: busca, gaveta, modal e acoes.
 */
export function OrdersPage() {
  const session = useSession();
  const { can } = useAuth();
  const { showToast } = useToast();
  const { invalidate } = useData();
  const { orders: ordersService } = useServices();

  const {
    data: orders,
    loading,
    error: loadError,
  } = useServiceQuery(() => ordersService.list(session.tenantId), session.tenantId, NO_ORDERS);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<OrderFilter>('Todas');

  // O codigo selecionado vive na URL, e nao em estado local. Assim a central de alertas pode
  // abrir uma encomenda especifica com um link, e recarregar a pagina mantem a gaveta aberta.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCode = searchParams.get('codigo');

  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const visible = useMemo(() => filterOrders(orders, filter, query), [orders, filter, query]);

  const selected = useMemo(
    () => orders.find((o) => o.code === selectedCode) ?? null,
    [orders, selectedCode],
  );

  /* --- Acoes --- */

  const selectOrder = useCallback(
    (code: string | null) => {
      setSearchParams(code ? { codigo: code } : {}, { replace: true });
    },
    [setSearchParams],
  );

  async function handleRefresh() {
    if (!selectedCode) return;

    setRefreshing(true);
    const response = await ordersService.refresh(session.tenantId, selectedCode);
    setRefreshing(false);

    showToast(responseMessage(response));

    if (response.success) invalidate();
  }

  async function handleCreate(input: NewOrderInput) {
    setSubmitting(true);
    setFormError('');

    const response = await ordersService.create(session.tenantId, input);

    setSubmitting(false);

    if (!response.success) {
      setFormError(responseMessage(response));
      return;
    }

    setModalOpen(false);
    setFilter('Todas');
    setQuery('');
    showToast(response.message);
    invalidate();
  }

  /* --- Render --- */

  return (
    <>
      <PageHeader
        eyebrow="Gestão de encomendas"
        title="Encomendas em trânsito"
        action={
          can.createOrders && (
            <Button
              onClick={() => {
                setFormError('');
                setModalOpen(true);
              }}
            >
              + Cadastrar pedido
            </Button>
          )
        }
      />

      {loadError ? (
        <ErrorState message={loadError} />
      ) : loading ? (
        <LoadingState message="Carregando encomendas…" />
      ) : (
        <>
          <KpiRow orders={orders} />

          <div className={styles.filters}>
            <input
              className={styles.search}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por código, destinatário ou cidade"
              aria-label="Buscar encomendas"
            />
            <div className={styles.chips}>
              {ORDER_FILTERS.map((f) => (
                <Chip
                  key={f}
                  label={f}
                  active={filter === f}
                  onClick={() => setFilter(f)}
                  count={
                    f === 'Com anomalia'
                      ? orders.filter((o) => o.hasAnomaly).length
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          <OrderTable orders={visible} onSelect={selectOrder} />

          <p className={styles.summary}>
            {visible.length} de {orders.length} encomendas · {session.tenantName}
          </p>
        </>
      )}

      <OrderDrawer
        order={selected}
        // Enquanto a lista carrega, um link direto para uma encomenda ainda nao tem o que
        // mostrar. A gaveta abre em estado de espera em vez de piscar vazia.
        loading={loading && selectedCode !== null}
        refreshing={refreshing}
        onClose={() => selectOrder(null)}
        onRefresh={handleRefresh}
      />

      <NewOrderModal
        open={modalOpen}
        submitting={submitting}
        serverError={formError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KpiRow } from '../../components/orders/KpiRow';
import { NewOrderModal } from '../../components/orders/NewOrderModal';
import { OrderDrawer } from '../../components/orders/OrderDrawer';
import { OrderTable } from '../../components/orders/OrderTable';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { ErrorState, LoadingState } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth, useSession } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import {
  createOrder,
  listOrders,
  refreshOrder,
  type NewOrderInput,
} from '../../services/ordersService';
import type { OrderStatus, OrderWithAnomalies } from '../../types';
import styles from './OrdersPage.module.css';

/** Filtros da barra. "Com anomalia" nao e um status, e um recorte sobre qualquer status. */
const FILTERS = [
  'Todas',
  'Com anomalia',
  'Em trânsito',
  'Parado',
  'Entrega frustrada',
  'Entregue',
] as const;

type Filter = (typeof FILTERS)[number];

export function OrdersPage() {
  const session = useSession();
  const { can } = useAuth();
  const { showToast } = useToast();
  const { version, invalidate } = useData();

  const [orders, setOrders] = useState<OrderWithAnomalies[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Todas');

  // O codigo selecionado vive na URL, e nao em estado local. Assim a central de alertas pode
  // abrir uma encomenda especifica com um link, e recarregar a pagina mantem a gaveta aberta.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCode = searchParams.get('codigo');

  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  /* --- Carregamento --- */

  useEffect(() => {
    let active = true;

    // Nao marca carregamento aqui de proposito. Na primeira vez o estado ja nasce verdadeiro;
    // nas recargas seguintes, disparadas por uma acao do usuario, a lista antiga continua
    // visivel ate a nova chegar. Sem isso a tela piscaria "Carregando…" a cada incidente
    // resolvido ou pedido cadastrado.
    listOrders(session.tenantId).then((response) => {
      if (!active) return;

      if (response.success) {
        setOrders(response.data);
        setLoadError('');
      } else {
        setLoadError(response.errors[0] ?? response.message);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [session.tenantId, version]);

  /* --- Filtragem --- */

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter =
        filter === 'Todas' ||
        (filter === 'Com anomalia' ? order.hasAnomaly : order.status === (filter as OrderStatus));

      if (!matchesFilter) return false;
      if (!q) return true;

      return (
        order.code.toLowerCase().includes(q) ||
        order.recipient.toLowerCase().includes(q) ||
        order.city.toLowerCase().includes(q)
      );
    });
  }, [orders, filter, query]);

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
    const response = await refreshOrder(session.tenantId, selectedCode);
    setRefreshing(false);

    showToast(response.success ? response.message : response.errors[0] ?? response.message);

    if (response.success) invalidate();
  }

  async function handleCreate(input: NewOrderInput) {
    setSubmitting(true);
    setFormError('');

    const response = await createOrder(session.tenantId, input);

    setSubmitting(false);

    if (!response.success) {
      setFormError(response.errors[0] ?? response.message);
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
              {FILTERS.map((f) => (
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

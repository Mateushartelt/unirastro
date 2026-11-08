import type { OrderWithAnomalies } from '../../types';
import { Chip } from '../ui/Chip';
import styles from './OrderFilters.module.css';
import { ORDER_FILTERS, type OrderFilter } from './orderFilters';

interface OrderFiltersProps {
  orders: OrderWithAnomalies[];
  query: string;
  filter: OrderFilter;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: OrderFilter) => void;
}

/** Busca livre e chips de filtro da lista de encomendas. */
export function OrderFilters({
  orders,
  query,
  filter,
  onQueryChange,
  onFilterChange,
}: Readonly<OrderFiltersProps>) {
  const anomalyCount = orders.filter((o) => o.hasAnomaly).length;

  return (
    <div className={styles.filters}>
      <input
        className={styles.search}
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Buscar por código, destinatário ou cidade"
        aria-label="Buscar encomendas"
      />
      <div className={styles.chips}>
        {ORDER_FILTERS.map((f) => (
          <Chip
            key={f}
            label={f}
            active={filter === f}
            onClick={() => onFilterChange(f)}
            count={f === 'Com anomalia' ? anomalyCount : undefined}
          />
        ))}
      </div>
    </div>
  );
}

import type { OrderWithAnomalies } from '../../types';
import { calendarDaysUntil } from '../../lib/format';
import styles from './KpiRow.module.css';

interface Kpi {
  label: string;
  value: number;
  tone: 'neutral' | 'warning' | 'danger' | 'success';
}

/**
 * Indicadores do topo da tela de encomendas.
 *
 * Todos derivam da mesma lista que a tabela mostra, nunca de uma contagem separada. Se
 * viessem de outra fonte, um dia diriam coisas diferentes sobre os mesmos pacotes — e o
 * usuario acreditaria no numero grande, nao na tabela.
 */
export function KpiRow({ orders }: { orders: OrderWithAnomalies[] }) {
  const kpis: Kpi[] = [
    {
      label: 'Em trânsito',
      value: orders.filter((o) => o.status !== 'Entregue').length,
      tone: 'neutral',
    },
    {
      label: 'Com anomalia',
      value: orders.filter((o) => o.hasAnomaly).length,
      tone: 'warning',
    },
    {
      label: 'Vencem hoje',
      value: orders.filter((o) => o.status !== 'Entregue' && calendarDaysUntil(o.dueAt) <= 0)
        .length,
      tone: 'danger',
    },
    {
      label: 'Entregues',
      value: orders.filter((o) => o.status === 'Entregue').length,
      tone: 'success',
    },
  ];

  return (
    <section className={styles.row} aria-label="Indicadores">
      {kpis.map((kpi) => (
        <div key={kpi.label} className={styles.card}>
          <p className={styles.label}>{kpi.label}</p>
          <p className={`${styles.value} ${styles[kpi.tone]}`}>{kpi.value}</p>
        </div>
      ))}
    </section>
  );
}

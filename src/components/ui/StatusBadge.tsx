import type { OrderStatus, Severity } from '../../types';
import styles from './StatusBadge.module.css';

/**
 * Pares de cor por status, tirados do design.
 *
 * Ficam num mapa porque a cor carrega significado: verde avanca, ambar trava, vermelho falha.
 * Espalhar esses pares pelos componentes garantiria que um dia divergissem.
 */
const STATUS_CLASS: Record<OrderStatus, string> = {
  'Em trânsito': styles.transit,
  'Saiu p/ entrega': styles.outForDelivery,
  Parado: styles.stalled,
  'Entrega frustrada': styles.failed,
  Entregue: styles.delivered,
  Postado: styles.posted,
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{status}</span>;
}

const SEVERITY_COLOR: Record<Severity, string> = {
  'Crítico': 'var(--red)',
  'Atenção': 'var(--orange)',
  Info: 'var(--muted)',
};

/** Cor associada a uma severidade, para pontos e rotulos. */
export function severityColor(severity: Severity): string {
  return SEVERITY_COLOR[severity];
}

export function SeverityDot({ severity }: { severity: Severity }) {
  return (
    <span
      className={styles.dot}
      style={{ background: severityColor(severity) }}
      aria-hidden="true"
    />
  );
}

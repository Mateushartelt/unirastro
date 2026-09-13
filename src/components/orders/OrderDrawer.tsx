import { dueLabel } from '../../lib/format';
import type { OrderWithAnomalies } from '../../types';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { LoadingState } from '../ui/Feedback';
import { severityColor } from '../ui/StatusBadge';
import styles from './OrderDrawer.module.css';
import { Timeline } from './Timeline';

interface OrderDrawerProps {
  order: OrderWithAnomalies | null;
  loading: boolean;
  refreshing: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

/**
 * Detalhe da encomenda, em painel lateral.
 *
 * Concentra o que o operador precisa para decidir se liga para a transportadora ou avisa o
 * cliente: a situacao atual, as anomalias detectadas com o motivo por extenso, e o historico
 * completo.
 */
export function OrderDrawer({
  order,
  loading,
  refreshing,
  onClose,
  onRefresh,
}: OrderDrawerProps) {
  const open = loading || order !== null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      label={order ? `Detalhe da encomenda ${order.code}` : 'Carregando encomenda'}
    >
      {loading || !order ? (
        <LoadingState message="Consultando encomenda…" />
      ) : (
        <>
          <header className={styles.header}>
            <p className={styles.carrier}>{order.carrier} · detectada automaticamente</p>
            <p className={styles.code}>{order.code}</p>
          </header>

          <div className={styles.facts}>
            <div className={styles.fact}>
              <p className={styles.factLabel}>Destinatário</p>
              <p className={styles.factValue}>{order.recipient}</p>
              <p className={styles.factMeta}>{order.city}</p>
            </div>
            <div className={styles.fact}>
              <p className={styles.factLabel}>Prazo</p>
              {(() => {
                const delivered = order.status === 'Entregue';
                const due = dueLabel(order.dueAt, delivered, order.timeline[0]?.at);
                return (
                  <p className={`${styles.factValue} ${due.urgent ? styles.urgent : ''}`}>
                    {due.text}
                  </p>
                );
              })()}
              <p className={styles.factMeta}>Status: {order.status}</p>
            </div>
          </div>

          {order.anomalies.length > 0 && (
            <section className={styles.anomalies} aria-label="Anomalias detectadas">
              {order.anomalies.map((anomaly) => (
                <article key={anomaly.rule} className={styles.anomaly}>
                  <p
                    className={styles.anomalyTitle}
                    style={{ color: severityColor(anomaly.severity) }}
                  >
                    {anomaly.rule} · {anomaly.severity} · RF04
                  </p>
                  <p className={styles.anomalyHeadline}>{anomaly.title}</p>
                  <p className={styles.anomalyText}>{anomaly.description}</p>
                </article>
              ))}
            </section>
          )}

          <div className={styles.timelineHead}>
            <h3 className={styles.timelineTitle}>Histórico unificado</h3>
            <Button size="sm" variant="outline" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? 'Consultando…' : 'Atualizar status'}
            </Button>
          </div>

          <Timeline events={order.timeline} highlightFirst={order.hasAnomaly} />

          <p className={styles.route}>
            {order.plannedRoute.length > 0
              ? `Rota prevista: ${order.plannedRoute.join(' → ')}`
              : 'Rota prevista ainda não informada pela transportadora.'}
          </p>
        </>
      )}
    </Drawer>
  );
}

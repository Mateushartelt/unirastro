import { dueLabel, relativeFromNow } from '../../lib/format';
import type { OrderWithAnomalies } from '../../types';
import { EmptyState } from '../ui/Feedback';
import { StatusBadge } from '../ui/StatusBadge';
import styles from './OrderTable.module.css';

interface OrderTableProps {
  orders: OrderWithAnomalies[];
  onSelect: (code: string) => void;
}

/**
 * Lista de encomendas.
 *
 * E uma `<table>` de verdade, e nao uma grade de `<div>` como no protótipo. O protótipo
 * precisava apenas parecer uma tabela; aqui ha cabecalhos que descrevem colunas, e um leitor
 * de tela precisa dessa relacao para anunciar "Status: Parado" em vez de ler seis valores
 * soltos. O resultado visual e o mesmo.
 */
export function OrderTable({ orders, onSelect }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className={styles.wrapper}>
        <EmptyState message="Nenhuma encomenda corresponde ao filtro." />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headRow}>
            <th scope="col">Código</th>
            <th scope="col">Transportadora</th>
            <th scope="col">Destinatário</th>
            <th scope="col">Status</th>
            <th scope="col">Prazo</th>
            <th scope="col">Última mov.</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const delivered = order.status === 'Entregue';
            const due = dueLabel(order.dueAt, delivered, order.timeline[0]?.at);
            const lastEvent = order.timeline[0];

            return (
              <tr
                key={order.code}
                className={`${styles.row} ${order.hasAnomaly ? styles.anomaly : ''}`}
                onClick={() => onSelect(order.code)}
                // A linha inteira e clicavel, entao precisa ser alcancavel pelo teclado e
                // responder a Enter como um botao responderia.
                tabIndex={0}
                role="button"
                aria-label={`Abrir detalhe da encomenda ${order.code}`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(order.code);
                  }
                }}
              >
                <td>
                  <span className={styles.codeCell}>
                    {order.hasAnomaly && (
                      <span
                        className={styles.anomalyDot}
                        title="Anomalia detectada"
                        aria-label="Anomalia detectada"
                      />
                    )}
                    <span className={styles.code}>{order.code}</span>
                  </span>
                </td>
                <td className={styles.carrier}>{order.carrier}</td>
                <td>
                  <span className={styles.recipient}>{order.recipient}</span>
                  <span className={styles.city}>{order.city}</span>
                </td>
                <td>
                  <StatusBadge status={order.status} />
                </td>
                <td className={due.urgent ? styles.dueUrgent : styles.due}>{due.text}</td>
                <td className={styles.lastMove}>
                  {lastEvent ? relativeFromNow(lastEvent.at) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

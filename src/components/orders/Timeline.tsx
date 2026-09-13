import { eventDateTime, relativeFromNow } from '../../lib/format';
import type { TrackingEvent } from '../../types';
import styles from './Timeline.module.css';

interface TimelineProps {
  events: TrackingEvent[];
  /** Pinta o evento mais recente de laranja quando a encomenda tem anomalia. */
  highlightFirst: boolean;
}

/**
 * Historico unificado (RF03).
 *
 * Esta e a tela que justifica o requisito. Os eventos chegam de transportadoras diferentes,
 * cada uma com seu vocabulario, e aparecem aqui num formato so. O codigo bruto de origem fica
 * visivel em texto secundario: padronizar a leitura nao pode significar perder o que a
 * transportadora realmente respondeu, senao uma auditoria fica sem lastro.
 */
export function Timeline({ events, highlightFirst }: TimelineProps) {
  return (
    <ol className={styles.timeline}>
      {events.map((event, index) => {
        const isFirst = index === 0;
        const isLast = index === events.length - 1;

        return (
          <li key={`${event.at}-${event.rawCode}`} className={styles.item}>
            <div className={styles.rail}>
              <span
                className={styles.dot}
                style={{
                  background: isFirst
                    ? highlightFirst
                      ? 'var(--orange)'
                      : 'var(--navy)'
                    : 'var(--grey-dot)',
                }}
                aria-hidden="true"
              />
              {!isLast && <span className={styles.line} aria-hidden="true" />}
            </div>

            <div className={styles.content}>
              <p className={styles.title}>{event.title}</p>
              <p className={styles.meta}>
                {event.place} · {eventDateTime(event.at)}
              </p>
              <p className={styles.raw}>
                {relativeFromNow(event.at)} · código da transportadora: {event.rawCode}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

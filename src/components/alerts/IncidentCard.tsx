import { Link } from 'react-router-dom';
import { relativeFromNow } from '../../lib/format';
import type { Incident } from '../../types';
import { Button } from '../ui/Button';
import { SeverityDot, severityColor } from '../ui/StatusBadge';
import styles from './IncidentCard.module.css';

interface IncidentCardProps {
  incident: Incident;
  canResolve: boolean;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
}

export function IncidentCard({ incident, canResolve, onResolve, onReopen }: IncidentCardProps) {
  return (
    <article className={`${styles.card} ${incident.resolved ? styles.resolved : ''}`}>
      <SeverityDot severity={incident.severity} />

      <div className={styles.body}>
        <p className={styles.tags}>
          <span className={styles.severity} style={{ color: severityColor(incident.severity) }}>
            {incident.severity}
          </span>
          <span className={styles.rule}>{incident.rule}</span>
        </p>

        <h3 className={styles.title}>{incident.title}</h3>
        <p className={styles.description}>{incident.description}</p>

        <p className={styles.meta}>
          {incident.code ? (
            // Leva a tela de encomendas com a gaveta daquele pedido ja aberta. E o caminho
            // que o operador sempre quer em seguida: ver o historico que gerou o alerta.
            <Link className={styles.code} to={`/encomendas?codigo=${incident.code}`}>
              {incident.code}
            </Link>
          ) : (
            <span className={styles.code}>—</span>
          )}
          <span>{incident.carrier}</span>
          <span>{relativeFromNow(incident.detectedAt)}</span>
          {incident.notified && (
            <span className={styles.notified}>✓ Cliente final notificado</span>
          )}
        </p>
      </div>

      {incident.resolved ? (
        canResolve ? (
          <Button size="sm" variant="subtle" onClick={() => onReopen(incident.id)}>
            Reabrir
          </Button>
        ) : (
          <span className={styles.resolvedTag}>Resolvido</span>
        )
      ) : (
        canResolve && (
          <Button size="sm" variant="outline" onClick={() => onResolve(incident.id)}>
            Resolver
          </Button>
        )
      )}
    </article>
  );
}

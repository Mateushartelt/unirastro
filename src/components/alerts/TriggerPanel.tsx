import type { NotificationTrigger } from '../../types';
import styles from './TriggerPanel.module.css';

interface TriggerPanelProps {
  triggers: NotificationTrigger[];
  /** Suporte enxerga a configuracao, mas nao a altera. */
  canEdit: boolean;
  onToggle: (id: string) => void;
}

/**
 * Parametrizacao dos avisos automaticos ao cliente final (RF05).
 *
 * O estado destes interruptores nao e decorativo: a central usa cada um deles para decidir se
 * um incidente daquele tipo ja gerou aviso. Desligar "Rota desviada" faz os desvios passarem a
 * aparecer como nao notificados.
 */
export function TriggerPanel({ triggers, canEdit, onToggle }: TriggerPanelProps) {
  const activeCount = triggers.filter((t) => t.enabled).length;

  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>Gatilhos de notificação</h2>
      <p className={styles.subtitle}>
        Eventos que disparam alerta automático ao cliente final.
      </p>

      {!canEdit && (
        <p className={styles.readOnly}>
          Seu perfil pode consultar, mas não alterar estes gatilhos. Alterações afetam todos os
          clientes finais da empresa.
        </p>
      )}

      <div className={styles.list}>
        {triggers.map((trigger) => (
          <div key={trigger.id} className={styles.row}>
            <div className={styles.info}>
              <p className={styles.label}>{trigger.label}</p>
              <p className={styles.hint}>{trigger.hint}</p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={trigger.enabled}
              aria-label={`${trigger.label}: ${trigger.enabled ? 'ativado' : 'desativado'}`}
              disabled={!canEdit}
              onClick={() => onToggle(trigger.id)}
              className={`${styles.toggle} ${trigger.enabled ? styles.on : ''}`}
            >
              <span className={styles.knob} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <p className={styles.footer}>
        <strong>{activeCount}</strong> gatilhos ativos · canais: e-mail e WhatsApp
      </p>
    </aside>
  );
}

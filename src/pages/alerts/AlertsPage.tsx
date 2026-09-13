import { useEffect, useMemo, useState } from 'react';
import { IncidentCard } from '../../components/alerts/IncidentCard';
import { TriggerPanel } from '../../components/alerts/TriggerPanel';
import { Chip } from '../../components/ui/Chip';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth, useSession } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import {
  listIncidents,
  listTriggers,
  reopenIncident,
  resolveIncident,
  toggleTrigger,
} from '../../services/alertsService';
import type { Incident, NotificationTrigger, Severity } from '../../types';
import styles from './AlertsPage.module.css';

const SEVERITY_FILTERS = ['Todos', 'Crítico', 'Atenção', 'Info'] as const;

type SeverityFilter = (typeof SEVERITY_FILTERS)[number];

/**
 * Central de incidentes (RF06), com a parametrizacao dos gatilhos ao lado (RF05).
 *
 * As duas coisas dividem a tela porque sao uma conversa so: a lista mostra o que o sistema
 * detectou, e o painel decide o que disso vira aviso automatico ao cliente final.
 */
export function AlertsPage() {
  const session = useSession();
  const { can } = useAuth();
  const { showToast } = useToast();
  const { version, invalidate } = useData();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [triggers, setTriggers] = useState<NotificationTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<SeverityFilter>('Todos');

  useEffect(() => {
    let active = true;

    // Ver a nota em OrdersPage: recarregar sem voltar ao estado de carregamento evita que a
    // lista pisque a cada incidente resolvido ou gatilho alterado.
    Promise.all([listIncidents(session.tenantId), listTriggers()]).then(
      ([incidentsResponse, triggersResponse]) => {
        if (!active) return;

        if (incidentsResponse.success) {
          setIncidents(incidentsResponse.data);
          setLoadError('');
        } else {
          setLoadError(incidentsResponse.errors[0] ?? incidentsResponse.message);
        }

        setTriggers(triggersResponse.data);
        setLoading(false);
      },
    );

    return () => {
      active = false;
    };
  }, [session.tenantId, version]);

  const visible = useMemo(
    () => incidents.filter((i) => filter === 'Todos' || i.severity === (filter as Severity)),
    [incidents, filter],
  );

  const openCount = incidents.filter((i) => !i.resolved).length;

  async function handleResolve(id: string) {
    const response = await resolveIncident(id);
    showToast(response.message);
    invalidate();
  }

  async function handleReopen(id: string) {
    const response = await reopenIncident(id);
    showToast(response.message);
    invalidate();
  }

  async function handleToggle(id: string) {
    const response = await toggleTrigger(id);

    if (!response.success) {
      showToast(response.errors[0] ?? response.message);
      return;
    }

    showToast(response.message);
    // Recarrega tambem os incidentes: o gatilho decide se cada um aparece como notificado.
    invalidate();
  }

  return (
    <>
      <PageHeader eyebrow="Alertas proativos" title="Central de incidentes" />

      <div className={styles.layout}>
        <section>
          <div className={styles.chips}>
            {SEVERITY_FILTERS.map((f) => (
              <Chip
                key={f}
                label={f}
                active={filter === f}
                onClick={() => setFilter(f)}
                count={
                  f === 'Todos'
                    ? incidents.length
                    : incidents.filter((i) => i.severity === f).length
                }
              />
            ))}
          </div>

          {loadError ? (
            <ErrorState message={loadError} />
          ) : loading ? (
            <LoadingState message="Analisando encomendas…" />
          ) : visible.length === 0 ? (
            <EmptyState
              message={
                incidents.length === 0
                  ? 'Nenhum incidente detectado. Todas as encomendas seguem dentro do previsto.'
                  : 'Nenhum incidente com essa severidade.'
              }
            />
          ) : (
            <>
              <div className={styles.list}>
                {visible.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    canResolve={can.resolveIncidents}
                    onResolve={handleResolve}
                    onReopen={handleReopen}
                  />
                ))}
              </div>

              <p className={styles.summary}>
                {openCount} em aberto de {incidents.length} incidentes · {session.tenantName}
              </p>
            </>
          )}
        </section>

        <TriggerPanel
          triggers={triggers}
          canEdit={can.editTriggers}
          onToggle={handleToggle}
        />
      </div>
    </>
  );
}

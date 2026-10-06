import { useMemo, useState } from 'react';
import { IncidentCard } from '../../components/alerts/IncidentCard';
import { TriggerPanel } from '../../components/alerts/TriggerPanel';
import { Chip } from '../../components/ui/Chip';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { useServices } from '../../composition/servicesContext';
import { useAuth, useSession } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { useServiceQuery } from '../../hooks/useServiceQuery';
import { responseMessage } from '../../services/response';
import type { ApiResponse, Incident, NotificationTrigger, Severity } from '../../types';
import styles from './AlertsPage.module.css';

const SEVERITY_FILTERS = ['Todos', 'Crítico', 'Atenção', 'Info'] as const;

type SeverityFilter = (typeof SEVERITY_FILTERS)[number];

const NO_INCIDENTS: Incident[] = [];
const NO_TRIGGERS: NotificationTrigger[] = [];

/**
 * Central de incidentes (RF06), com a parametrizacao dos gatilhos ao lado (RF05).
 *
 * As duas coisas dividem a tela porque sao uma conversa so: a lista mostra o que o sistema
 * detectou, e o painel decide o que disso vira aviso automatico ao cliente final.
 *
 * Usa dois contratos separados, IIncidentsService e ITriggersService. Antes os dois viviam no
 * mesmo modulo alertsService.ts.
 */
export function AlertsPage() {
  const session = useSession();
  const { can } = useAuth();
  const { showToast } = useToast();
  const { invalidate } = useData();
  const { incidents: incidentsService, triggers: triggersService } = useServices();

  const incidentsQuery = useServiceQuery(
    () => incidentsService.list(session.tenantId),
    session.tenantId,
    NO_INCIDENTS,
  );
  const triggersQuery = useServiceQuery(() => triggersService.list(), 'triggers', NO_TRIGGERS);

  const incidents = incidentsQuery.data;
  const triggers = triggersQuery.data;
  const loading = incidentsQuery.loading;
  const loadError = incidentsQuery.error;

  const [filter, setFilter] = useState<SeverityFilter>('Todos');

  const visible = useMemo(
    () => incidents.filter((i) => filter === 'Todos' || i.severity === (filter as Severity)),
    [incidents, filter],
  );

  const openCount = incidents.filter((i) => !i.resolved).length;

  /** Toda acao da tela segue o mesmo roteiro: chama o servico, avisa e, se deu certo, recarrega. */
  async function run(action: Promise<ApiResponse<unknown>>) {
    const response = await action;
    showToast(responseMessage(response));
    // Recarrega tudo que observa o DataContext: a contagem da barra lateral e, no caso dos
    // gatilhos, os incidentes, porque o gatilho decide se cada um aparece como notificado.
    if (response.success) invalidate();
  }

  const handleResolve = (id: string) => run(incidentsService.resolve(session.tenantId, id));
  const handleReopen = (id: string) => run(incidentsService.reopen(session.tenantId, id));
  const handleToggle = (id: string) => run(triggersService.toggle(id));

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

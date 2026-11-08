import { useMemo, useState } from 'react';
import { IncidentList } from '../../components/alerts/IncidentList';
import { SeverityChips } from '../../components/alerts/SeverityChips';
import { filterBySeverity, type SeverityFilter } from '../../components/alerts/severityFilters';
import { TriggerPanel } from '../../components/alerts/TriggerPanel';
import { AsyncContent } from '../../components/ui/AsyncContent';
import { PageHeader } from '../../components/ui/PageHeader';
import { useServices } from '../../composition/servicesContext';
import { useAuth, useSession } from '../../contexts/AuthContext';
import { useServiceQuery } from '../../hooks/useServiceQuery';
import type { Incident, NotificationTrigger } from '../../types';
import styles from './AlertsPage.module.css';
import { useAlertActions } from './useAlertActions';

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
  const { incidents: incidentsService, triggers: triggersService } = useServices();
  const actions = useAlertActions();

  const incidentsQuery = useServiceQuery(
    () => incidentsService.list(session.tenantId),
    session.tenantId,
    NO_INCIDENTS,
  );
  const triggersQuery = useServiceQuery(() => triggersService.list(), 'triggers', NO_TRIGGERS);
  const incidents = incidentsQuery.data;

  const [filter, setFilter] = useState<SeverityFilter>('Todos');
  const visible = useMemo(() => filterBySeverity(incidents, filter), [incidents, filter]);
  const openCount = incidents.filter((i) => !i.resolved).length;

  return (
    <>
      <PageHeader eyebrow="Alertas proativos" title="Central de incidentes" />

      <div className={styles.layout}>
        <section>
          <SeverityChips
            className={styles.chips}
            incidents={incidents}
            active={filter}
            onChange={setFilter}
          />

          <AsyncContent
            loading={incidentsQuery.loading}
            error={incidentsQuery.error}
            loadingMessage="Analisando encomendas…"
          >
            <IncidentList
              className={styles.list}
              incidents={visible}
              totalCount={incidents.length}
              canResolve={can.resolveIncidents}
              onResolve={actions.resolve}
              onReopen={actions.reopen}
            />
            {visible.length > 0 && (
              <p className={styles.summary}>
                {openCount} em aberto de {incidents.length} incidentes · {session.tenantName}
              </p>
            )}
          </AsyncContent>
        </section>

        <TriggerPanel
          triggers={triggersQuery.data}
          canEdit={can.editTriggers}
          onToggle={actions.toggleTrigger}
        />
      </div>
    </>
  );
}

import { Outlet } from 'react-router-dom';
import { useServices } from '../../composition/servicesContext';
import { useSession } from '../../contexts/AuthContext';
import { useServiceQuery } from '../../hooks/useServiceQuery';
import styles from './AppShell.module.css';
import { Sidebar } from './Sidebar';

const INITIAL_WORKER_STATUS = { lastSyncAt: new Date().toISOString(), queueSize: 0 };

/**
 * Casca comum das telas autenticadas: barra lateral fixa e area de conteudo.
 *
 * Tambem carrega os dados que a barra lateral mostra (contagem de incidentes abertos e
 * situacao dos workers) para que as paginas nao precisem saber que a barra existe.
 *
 * Antes lia `incidents.data` sem checar `success`: uma falha do servico derrubava a casca
 * inteira. O hook so entrega `data` de respostas bem sucedidas.
 */
export function AppShell() {
  const session = useSession();
  const { incidents, workerStatus } = useServices();

  const incidentsQuery = useServiceQuery(
    () => incidents.list(session.tenantId),
    session.tenantId,
    [],
  );
  const workerQuery = useServiceQuery(() => workerStatus.get(), 'worker', INITIAL_WORKER_STATUS);

  const openIncidents = incidentsQuery.data.filter((i) => !i.resolved).length;
  const worker = workerQuery.data;

  return (
    <div className={styles.shell}>
      <Sidebar
        openIncidents={openIncidents}
        lastSyncAt={worker.lastSyncAt}
        queueSize={worker.queueSize}
      />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

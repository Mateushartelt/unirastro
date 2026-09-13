import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSession } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { listIncidents } from '../../services/alertsService';
import { getWorkerStatus } from '../../services/ordersService';
import styles from './AppShell.module.css';
import { Sidebar } from './Sidebar';

/**
 * Casca comum das telas autenticadas: barra lateral fixa e area de conteudo.
 *
 * Tambem carrega os dados que a barra lateral mostra — contagem de incidentes abertos e
 * situacao dos workers — para que as paginas nao precisem saber que a barra existe.
 */
export function AppShell() {
  const session = useSession();
  const { version } = useData();

  const [openIncidents, setOpenIncidents] = useState(0);
  const [worker, setWorker] = useState({
    lastSyncAt: new Date().toISOString(),
    queueSize: 0,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      const [incidents, status] = await Promise.all([
        listIncidents(session.tenantId),
        getWorkerStatus(),
      ]);

      // A tela pode ter sido desmontada durante a espera. Gravar estado depois disso avisaria
      // sobre atualizacao em componente desmontado e, pior, sobrescreveria dados mais novos.
      if (!active) return;

      setOpenIncidents(incidents.data.filter((i) => !i.resolved).length);
      setWorker(status.data);
    }

    void load();

    return () => {
      active = false;
    };
  }, [session.tenantId, version]);

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

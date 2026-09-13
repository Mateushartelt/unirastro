import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { clockTime, formatCount, initials } from '../../lib/format';
import styles from './Sidebar.module.css';

interface SidebarProps {
  /** Incidentes abertos, exibidos como contagem ao lado de "Alertas". */
  openIncidents: number;
  lastSyncAt: string;
  queueSize: number;
}

export function Sidebar({ openIncidents, lastSyncAt, queueSize }: SidebarProps) {
  const { session, signOut } = useAuth();

  if (!session) return null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          U
        </span>
        <span>
          <span className={styles.brandName}>UNIRASTRO</span>
          <span className={styles.brandSub}>Painel operacional</span>
        </span>
      </div>

      <nav className={styles.nav} aria-label="Navegação principal">
        <NavLink
          to="/encomendas"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
        >
          Encomendas
        </NavLink>

        <NavLink
          to="/alertas"
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
        >
          Alertas
          {openIncidents > 0 && <span className={styles.badge}>{openIncidents}</span>}
        </NavLink>

        {/*
          Desempenho esta desenhado no protótipo mas nao entra nesta entrega. Aparece
          desabilitado de proposito: esconder o item daria a impressao de que o produto nao
          preve relatorios, quando na verdade eles sao a proxima fase.
        */}
        <span className={`${styles.item} ${styles.disabled}`} aria-disabled="true">
          Desempenho
          <span className={styles.soon}>em breve</span>
        </span>
      </nav>

      <div className={styles.workers}>
        <p className={styles.workersTitle}>
          <span className={styles.pulse} aria-hidden="true" />
          Workers ativos
        </p>
        <p className={styles.workersLine}>Última consulta às APIs: {clockTime(lastSyncAt)}</p>
        <p className={styles.workersLine}>Fila: {formatCount(queueSize)} eventos pendentes</p>
      </div>

      <div className={styles.user}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(session.name)}
        </span>
        <span className={styles.userInfo}>
          <span className={styles.userName}>{session.name}</span>
          <span className={styles.userRole}>{session.role}</span>
          <span className={styles.userTenant}>{session.tenantName}</span>
        </span>
      </div>

      <button type="button" className={styles.signOut} onClick={signOut}>
        Sair
      </button>
    </aside>
  );
}

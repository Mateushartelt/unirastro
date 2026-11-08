import styles from './LoginPage.module.css';

interface DemoAccount {
  email: string;
  password: string;
  role: string;
  tenant: string;
}

interface DemoAccountListProps {
  accounts: DemoAccount[];
  onPick: (email: string, password: string) => void;
}

/** Contas de demonstracao: um clique preenche o formulario de login. */
export function DemoAccountList({ accounts, onPick }: Readonly<DemoAccountListProps>) {
  return (
    <div className={styles.demo}>
      <p className={styles.demoTitle}>Contas de demonstração</p>
      <ul className={styles.demoList}>
        {accounts.map((c) => (
          <li key={c.email}>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() => onPick(c.email, c.password)}
            >
              <span className={styles.demoRole}>{c.role}</span>
              <span className={styles.demoEmail}>{c.email}</span>
              <span className={styles.demoMeta}>
                senha: {c.password} · {c.tenant}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

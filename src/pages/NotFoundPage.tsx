import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <main className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Página não encontrada</h1>
      <p className={styles.text}>
        O endereço acessado não existe no painel. Talvez o link esteja desatualizado.
      </p>
      <Link className={styles.link} to="/encomendas">
        Voltar para encomendas
      </Link>
    </main>
  );
}

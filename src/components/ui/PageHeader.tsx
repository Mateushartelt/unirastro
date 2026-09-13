import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  /** Sobretitulo em maiusculas, que situa a tela dentro do produto. */
  eyebrow: string;
  title: string;
  /** Acao principal da tela, alinhada a direita. */
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, action }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
      </div>
      {action}
    </header>
  );
}

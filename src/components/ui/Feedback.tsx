import styles from './Feedback.module.css';

/**
 * Estado vazio.
 *
 * Distingue "nada aqui" de "nada encontrado". A primeira situacao e informativa, a segunda
 * costuma ser um filtro esquecido, e dizer qual das duas e poupa o usuario de procurar um
 * problema que nao existe.
 */
export function EmptyState({ message }: { message: string }) {
  return <p className={styles.empty}>{message}</p>;
}

/**
 * Estado de carregamento.
 *
 * Anunciado como `status` para que leitores de tela informem a espera. Sem isso a tela fica
 * silenciosa para quem nao ve a mudanca.
 */
export function LoadingState({ message = 'Carregando…' }: { message?: string }) {
  return (
    <p className={styles.loading} role="status" aria-live="polite">
      {message}
    </p>
  );
}

/** Falha de carregamento, com a mensagem que veio do servico. */
export function ErrorState({ message }: { message: string }) {
  return (
    <p className={styles.error} role="alert">
      {message}
    </p>
  );
}

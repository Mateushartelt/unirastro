import styles from './LoginPage.module.css';

/** Metade navy da tela de login: marca e proposta de valor. */
export function BrandPanel() {
  return (
    <section className={styles.brandPanel}>
      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          U
        </span>
        <span>
          <span className={styles.brandName}>UNIRASTRO</span>
          <span className={styles.brandSub}>Painel operacional</span>
        </span>
      </div>

      <div className={styles.pitchGroup}>
        <p className={styles.pitch}>Saiba do atraso antes do seu cliente.</p>
        <p className={styles.pitchSub}>
          Rastreamento unificado entre transportadoras, com detecção automática de anomalias
          e aviso proativo ao cliente final.
        </p>
      </div>
    </section>
  );
}

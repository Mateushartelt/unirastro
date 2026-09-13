import styles from './Chip.module.css';

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  /** Contagem opcional ao lado do rotulo, util nos filtros. */
  count?: number;
}

/**
 * Ficha de filtro. Invertida quando ativa: fundo escuro, texto claro.
 *
 * Usa `aria-pressed` porque isto e um interruptor de estado, nao um link. Um leitor de tela
 * precisa anunciar que o filtro esta aplicado, e nao apenas ler o rotulo.
 */
export function Chip({ label, active, onClick, count }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${styles.chip} ${active ? styles.active : ''}`}
    >
      {label}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}

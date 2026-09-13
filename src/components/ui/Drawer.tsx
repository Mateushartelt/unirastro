import type { ReactNode } from 'react';
import styles from './Drawer.module.css';
import { useOverlay } from './useOverlay';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Titulo acessivel do painel, anunciado por leitores de tela. */
  label: string;
  children: ReactNode;
}

/**
 * Painel lateral deslizante, usado para o detalhe da encomenda.
 *
 * A gaveta foi a escolha do design em vez de uma pagina separada, e ela se justifica: o
 * operador consulta um pacote sem perder a lista filtrada que levou trabalho a montar.
 */
export function Drawer({ open, onClose, label, children }: DrawerProps) {
  useOverlay(open, onClose);

  if (!open) return null;

  return (
    <>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-label={label}>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Fechar detalhe"
        >
          ×
        </button>
        {children}
      </aside>
    </>
  );
}

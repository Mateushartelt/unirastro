import { useId, type FormEvent, type ReactNode } from 'react';
import styles from './Modal.module.css';
import { useOverlay } from './useOverlay';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  /** Botoes de acao, alinhados a direita no rodape. */
  actions: ReactNode;
}

/**
 * Janela modal em forma de formulario.
 *
 * O conteudo e um `<form>` de verdade, e nao uma `<div>` com um botao. Isso entrega de graca
 * o envio pela tecla Enter, que e como alguem cadastrando dezenas de codigos realmente
 * trabalha.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  onSubmit,
  children,
  actions,
}: ModalProps) {
  const titleId = useId();
  useOverlay(open, onClose);

  if (!open) return null;

  return (
    <div className={styles.scrim} onClick={onClose}>
      <form
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={onSubmit}
        // Sem isto, clicar dentro do formulario borbulharia ate a sobreposicao e fecharia a
        // janela no meio do preenchimento.
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className={styles.title} id={titleId}>
          {title}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
        {children}
        <div className={styles.actions}>{actions}</div>
      </form>
    </div>
  );
}

import { CircleHelp } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import styles from './InfoTooltip.module.css';

interface InfoTooltipProps {
  /** Nome acessivel do botao, lido por leitores de tela. */
  label: string;
  children: ReactNode;
}

/**
 * Icone de ajuda (CircleHelp, do lucide-react) que mostra um texto ao passar o mouse ou focar
 * com o teclado.
 *
 * A ajuda abre so com CSS (:hover e :focus-within), sem estado: nao ha clique para lembrar de
 * fechar. O aria-describedby liga o botao ao texto para leitores de tela.
 */
export function InfoTooltip({ label, children }: Readonly<InfoTooltipProps>) {
  const id = useId();

  return (
    <span className={styles.wrap}>
      <button type="button" className={styles.trigger} aria-label={label} aria-describedby={id}>
        <CircleHelp size={15} strokeWidth={2} aria-hidden="true" />
      </button>
      <span id={id} role="tooltip" className={styles.bubble}>
        {children}
      </span>
    </span>
  );
}

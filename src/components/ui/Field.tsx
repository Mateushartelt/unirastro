import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Field.module.css';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Conteudo abaixo do campo: dica, erro, resultado de deteccao. */
  footer?: ReactNode;
  /** Fonte monoespacada, para codigos de rastreio. */
  mono?: boolean;
}

/**
 * Campo com rotulo associado.
 *
 * O `useId` liga rotulo e campo sem que quem usa o componente precise inventar um
 * identificador unico — e sem risco de colisao quando o mesmo campo aparece duas vezes na
 * pagina.
 */
export function Field({ label, footer, mono = false, className, ...rest }: FieldProps) {
  const id = useId();

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={[styles.input, mono ? styles.mono : '', className].filter(Boolean).join(' ')}
        {...rest}
      />
      {footer}
    </div>
  );
}

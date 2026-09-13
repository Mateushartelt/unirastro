import { useState, type FormEvent } from 'react';
import { describeDetection, supportedFormats } from '../../lib/carrierDetection';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
import styles from './NewOrderModal.module.css';

interface NewOrderModalProps {
  open: boolean;
  submitting: boolean;
  /** Erro devolvido pelo servico, como codigo duplicado. */
  serverError: string;
  onClose: () => void;
  onSubmit: (input: { code: string; recipient: string; city: string }) => void;
}

const DETECTION_TONE = {
  idle: styles.detectIdle,
  detected: styles.detectOk,
  unknown: styles.detectFail,
} as const;

/**
 * Cadastro manual de encomenda (RF01).
 *
 * O ponto do requisito esta na linha abaixo do campo de codigo: a transportadora aparece
 * enquanto se digita, sem lista para escolher. Quem cadastra cinquenta codigos por dia nao
 * quer selecionar a transportadora cinquenta vezes, e o codigo ja carrega essa informacao.
 */
export function NewOrderModal({
  open,
  submitting,
  serverError,
  onClose,
  onSubmit,
}: NewOrderModalProps) {
  const [code, setCode] = useState('');
  const [recipient, setRecipient] = useState('');
  const [city, setCity] = useState('');

  const detection = describeDetection(code);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ code, recipient, city });
  }

  // Limpa os campos ao fechar, para que a proxima abertura comece vazia.
  function handleClose() {
    setCode('');
    setRecipient('');
    setCity('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Cadastrar pedido"
      description="Informe o código de rastreio — a transportadora é identificada automaticamente."
      onSubmit={handleSubmit}
      actions={
        <>
          <Button variant="subtle" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Salvando…' : 'Salvar e rastrear'}
          </Button>
        </>
      }
    >
      <Field
        label="Código de rastreio"
        mono
        autoFocus
        placeholder="ex: NL123456789BR"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        footer={
          <p className={`${styles.detect} ${DETECTION_TONE[detection.status]}`}>
            <span className={styles.detectDot} aria-hidden="true" />
            <span>{detection.message}</span>
          </p>
        }
      />

      <div className={styles.pair}>
        <Field
          label="Destinatário"
          placeholder="Nome completo"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <Field
          label="Cidade / UF"
          placeholder="São Paulo, SP"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>

      {serverError && (
        <p className={styles.error} role="alert">
          {serverError}
        </p>
      )}

      <details className={styles.formats}>
        <summary className={styles.formatsSummary}>Formatos aceitos</summary>
        <ul className={styles.formatsList}>
          {supportedFormats().map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </details>
    </Modal>
  );
}

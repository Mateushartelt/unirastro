import { useState, type SubmitEvent } from 'react';
import { useServices } from '../../composition/servicesContext';
import type { NewOrderInput } from '../../domain/orders/newOrder';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { describeDetection } from './carrierFeedback';
import styles from './NewOrderModal.module.css';

interface NewOrderModalProps {
  open: boolean;
  submitting: boolean;
  /** Erro devolvido pelo servico, como codigo duplicado. */
  serverError: string;
  onClose: () => void;
  onSubmit: (input: NewOrderInput) => void;
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
}: Readonly<NewOrderModalProps>) {
  const fields = useNewOrderFields();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(fields.values);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cadastrar pedido"
      description="Informe o código de rastreio — a transportadora é identificada automaticamente."
      onSubmit={handleSubmit}
      actions={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Salvando…' : 'Salvar e rastrear'}
          </Button>
        </>
      }
    >
      <NewOrderFields fields={fields} />
      {serverError && (
        <p className={styles.error} role="alert">
          {serverError}
        </p>
      )}
      <SupportedFormats />
    </Modal>
  );
}

function useNewOrderFields() {
  const [code, setCode] = useState('');
  const [recipient, setRecipient] = useState('');
  const [city, setCity] = useState('');

  return { values: { code, recipient, city }, setCode, setRecipient, setCity };
}

function NewOrderFields({ fields }: Readonly<{ fields: ReturnType<typeof useNewOrderFields> }>) {
  const { code, recipient, city } = fields.values;

  return (
    <>
      <Field
        label="Código de rastreio"
        mono
        autoFocus
        placeholder="ex: NL123456789BR"
        value={code}
        onChange={(e) => fields.setCode(e.target.value.toUpperCase())}
        footer={<DetectionHint code={code} />}
      />
      <div className={styles.pair}>
        <Field
          label="Destinatário"
          placeholder="Nome completo"
          value={recipient}
          onChange={(e) => fields.setRecipient(e.target.value)}
        />
        <Field
          label="Cidade / UF"
          placeholder="São Paulo, SP"
          value={city}
          onChange={(e) => fields.setCity(e.target.value)}
        />
      </div>
    </>
  );
}

/** A transportadora aparece enquanto se digita (RF01). */
function DetectionHint({ code }: Readonly<{ code: string }>) {
  const { carrierDetection } = useServices();
  const detection = describeDetection(code, carrierDetection.detect(code));

  return (
    <p className={`${styles.detect} ${DETECTION_TONE[detection.status]}`}>
      <span className={styles.detectDot} aria-hidden="true" />
      <span>{detection.message}</span>
    </p>
  );
}

function SupportedFormats() {
  const { carrierDetection } = useServices();

  return (
    <details className={styles.formats}>
      <summary className={styles.formatsSummary}>Formatos aceitos</summary>
      <ul className={styles.formatsList}>
        {carrierDetection.supportedFormats().map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </details>
  );
}

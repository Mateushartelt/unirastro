import { useState } from 'react';
import { useServices } from '../../composition/servicesContext';
import { useSession } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import type { NewOrderInput } from '../../domain/orders/newOrder';
import { responseMessage } from '../../services/response';

/** Consulta de status sob demanda (RF02) da encomenda aberta na gaveta. */
export function useOrderRefresh(code: string | null) {
  const session = useSession();
  const { showToast } = useToast();
  const { invalidate } = useData();
  const { orders } = useServices();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    if (!code) return;

    setRefreshing(true);
    const response = await orders.refresh(session.tenantId, code);
    setRefreshing(false);

    showToast(responseMessage(response));
    if (response.success) invalidate();
  }

  return { refreshing, refresh };
}

/** Estado do modal de cadastro (RF01): aberto, enviando e o erro devolvido pelo servidor. */
export function useNewOrderForm(onCreated: () => void) {
  const session = useSession();
  const { showToast } = useToast();
  const { invalidate } = useData();
  const { orders } = useServices();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Muda a cada abertura: o modal e recriado e comeca sempre com os campos vazios.
  const [formKey, setFormKey] = useState(0);

  function openForm() {
    setError('');
    setFormKey((key) => key + 1);
    setOpen(true);
  }

  async function submit(input: NewOrderInput) {
    setSubmitting(true);
    setError('');
    const response = await orders.create(session.tenantId, input);
    setSubmitting(false);

    if (!response.success) {
      setError(responseMessage(response));
      return;
    }

    setOpen(false);
    onCreated();
    showToast(response.message);
    invalidate();
  }

  return { open, formKey, submitting, error, openForm, close: () => setOpen(false), submit };
}

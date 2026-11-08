import { useState, type SubmitEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/** Estado do formulario de login e o envio, que volta para a pagina de onde o usuario veio. */
export function useLoginForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    const from = (location.state as { from?: string } | null)?.from;
    navigate(from ?? '/encomendas', { replace: true });
  }

  /** Preenche o formulario a partir de uma das contas de demonstracao. */
  function fillWith(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  }

  return { email, password, error, submitting, setEmail, setPassword, submit, fillWith };
}

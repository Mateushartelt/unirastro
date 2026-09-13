import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { useAuth } from '../../contexts/AuthContext';
import { DEMO_CREDENTIALS } from '../../mocks/users';
import styles from './LoginPage.module.css';

/**
 * Entrada do sistema (RF10).
 *
 * Nao existe no protótipo do design, que ja comeca dentro do painel. Foi construida na mesma
 * linguagem visual: fundo bege, cartao claro de cantos retos, titulo em Sora e o navy da marca
 * ocupando metade da tela.
 *
 * As credenciais de teste ficam visiveis na propria pagina. Numa entrega academica isso vale
 * mais do que esconde-las: quem avalia entra sem pedir ajuda.
 */
export function LoginPage() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quem ja tem sessao nao volta ao login pelo botao de voltar do navegador.
  if (session) return <Navigate to="/encomendas" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

  /** Preenche o formulario a partir de uma das contas de demonstração. */
  function fillWith(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  }

  return (
    <div className={styles.page}>
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

      <section className={styles.formPanel}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Entrar</h1>
          <p className={styles.subtitle}>Acesse o painel da sua empresa.</p>

          <div className={styles.fields}>
            <Field
              label="E-mail"
              type="email"
              autoComplete="username"
              placeholder="voce@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              label="Senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>

          <div className={styles.demo}>
            <p className={styles.demoTitle}>Contas de demonstração</p>
            <ul className={styles.demoList}>
              {DEMO_CREDENTIALS.map((c) => (
                <li key={c.email}>
                  <button
                    type="button"
                    className={styles.demoButton}
                    onClick={() => fillWith(c.email, c.password)}
                  >
                    <span className={styles.demoRole}>{c.role}</span>
                    <span className={styles.demoEmail}>{c.email}</span>
                    <span className={styles.demoMeta}>
                      senha: {c.password} · {c.tenant}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </form>
      </section>
    </div>
  );
}

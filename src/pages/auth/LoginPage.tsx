import { Navigate } from 'react-router-dom';
import { BrandPanel } from './BrandPanel';
import { DemoAccountList } from './DemoAccountList';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { useServices } from '../../composition/servicesContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from './LoginPage.module.css';
import { useLoginForm } from './useLoginForm';

/**
 * Entrada do sistema (RF10).
 *
 * Nao existe no protótipo do design, que ja comeca dentro do painel. Foi construida na mesma
 * linguagem visual: fundo bege, cartao claro de cantos retos, titulo em Sora e o navy da marca
 * ocupando metade da tela.
 *
 * As credenciais de teste ficam visiveis na propria pagina. Numa entrega academica isso vale
 * mais do que esconde-las: quem avalia entra sem pedir ajuda. Elas chegam pelo contrato
 * IDemoAccounts; antes esta pagina importava mocks/users.ts direto.
 */
export function LoginPage() {
  const { session } = useAuth();
  const { demoAccounts } = useServices();
  const form = useLoginForm();

  // Quem ja tem sessao nao volta ao login pelo botao de voltar do navegador.
  if (session) return <Navigate to="/encomendas" replace />;

  return (
    <div className={styles.page}>
      <BrandPanel />

      <section className={styles.formPanel}>
        <form className={styles.card} onSubmit={form.submit}>
          <h1 className={styles.title}>Entrar</h1>
          <p className={styles.subtitle}>Acesse o painel da sua empresa.</p>

          <div className={styles.fields}>
            <Field
              label="E-mail"
              type="email"
              autoComplete="username"
              placeholder="voce@empresa.com.br"
              value={form.email}
              onChange={(e) => form.setEmail(e.target.value)}
            />
            <Field
              label="Senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => form.setPassword(e.target.value)}
            />
          </div>

          {form.error && (
            <p className={styles.error} role="alert">
              {form.error}
            </p>
          )}

          <Button type="submit" className={styles.submit} disabled={form.submitting}>
            {form.submitting ? 'Entrando…' : 'Entrar'}
          </Button>

          <DemoAccountList accounts={demoAccounts.list()} onPick={form.fillWith} />
        </form>
      </section>
    </div>
  );
}

/**
 * Autenticacao simulada (RF10).
 *
 * Nao ha token nem verificacao real. O que importa nesta fase e que a sessao carregue papel e
 * tenant, porque sao esses dois campos que governam o que cada usuario ve e pode fazer.
 */

import { MOCK_TENANTS, MOCK_USERS } from '../mocks/users';
import type { ApiResponse, Role, Session } from '../types';
import { fail, ok } from './client';

const SESSION_KEY = 'unirastro.session';

function toSession(user: (typeof MOCK_USERS)[number]): Session {
  const { password: _password, ...rest } = user;
  const tenant = MOCK_TENANTS.find((t) => t.id === user.tenantId);
  return { ...rest, tenantName: tenant?.name ?? 'Empresa' };
}

export async function login(email: string, password: string): Promise<ApiResponse<Session | null>> {
  const normalized = email.trim().toLowerCase();

  if (!normalized || !password) {
    return fail('Informe e-mail e senha.', ['E-mail e senha são obrigatórios.']);
  }

  const user = MOCK_USERS.find((u) => u.email.toLowerCase() === normalized);

  // Mensagem unica para usuario inexistente e senha errada: nao vale entregar a um
  // desconhecido a informacao de quais e-mails existem na base.
  if (!user || user.password !== password) {
    return fail('Credenciais inválidas.', ['E-mail ou senha incorretos.']);
  }

  const session = toSession(user);
  persist(session);

  return ok(session, `Bem-vindo, ${session.name.split(' ')[0]}.`);
}

export async function logout(): Promise<ApiResponse<null>> {
  clearPersisted();
  return ok(null, 'Sessão encerrada.');
}

/**
 * Sessao guardada no navegador, lida na inicializacao.
 *
 * Sincrona de proposito: o roteador precisa saber se ha sessao antes da primeira renderizacao,
 * senao a aplicacao pisca a tela de login para quem ja estava autenticado.
 */
export function restoreSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Session;

    // O conteudo veio de fora do codigo e pode estar velho ou adulterado. Confere-se o minimo
    // antes de confiar nele.
    const stillValid = MOCK_USERS.some(
      (u) => u.id === parsed.id && u.tenantId === parsed.tenantId,
    );

    return stillValid ? parsed : null;
  } catch {
    return null;
  }
}

function persist(session: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Navegacao anonima ou armazenamento bloqueado. A sessao vale enquanto a aba viver.
  }
}

function clearPersisted(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nada a fazer: se nao deu para gravar, tambem nao havia o que apagar.
  }
}

/* ------------------------------------------------------------------ *
 * Permissoes
 * ------------------------------------------------------------------ */

/**
 * Quem pode alterar os gatilhos de notificacao.
 *
 * Suporte enxerga a configuracao, mas nao a altera: mudar um gatilho muda o que milhares de
 * clientes finais recebem, e isso e decisao de quem responde pela operacao.
 */
export function canEditTriggers(role: Role): boolean {
  return role === 'Admin' || role === 'Operador de Logística';
}

/** Quem pode cadastrar encomendas. */
export function canCreateOrders(role: Role): boolean {
  return role === 'Admin' || role === 'Operador de Logística';
}

/** Quem pode marcar um incidente como resolvido. Suporte trata incidentes, entao pode. */
export function canResolveIncidents(_role: Role): boolean {
  return true;
}

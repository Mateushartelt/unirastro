/**
 * Autenticacao simulada (RF10).
 *
 * Nao ha token nem verificacao real. O que importa nesta fase e que a sessao carregue papel e
 * tenant, porque sao esses dois campos que governam o que cada usuario ve e pode fazer.
 *
 * Antes, o authService fazia tres coisas: autenticava, gravava a sessao no localStorage e
 * decidia permissoes. Agora ele so autentica. Onde a sessao fica e problema do ISessionStorage,
 * de onde vem o usuario e problema do IUserDirectory, e permissao e regra de dominio
 * (domain/permissions.ts).
 */

import type { ApiResponse, Session, User } from '../../types';
import type { IAuthService } from '../contracts';
import type { ISessionStorage, IUserDirectory } from './ports';
import type { SimulatedNetwork } from './SimulatedNetwork';

export class SimulatedAuthService implements IAuthService {
  private readonly users: IUserDirectory;
  private readonly sessions: ISessionStorage;
  private readonly network: SimulatedNetwork;

  constructor(users: IUserDirectory, sessions: ISessionStorage, network: SimulatedNetwork) {
    this.users = users;
    this.sessions = sessions;
    this.network = network;
  }

  async login(email: string, password: string): Promise<ApiResponse<Session>> {
    const normalized = email.trim().toLowerCase();

    if (!normalized || !password) {
      return this.network.fail('Informe e-mail e senha.', ['E-mail e senha são obrigatórios.']);
    }

    const user = this.users.findByEmail(normalized);

    // Mensagem unica para usuario inexistente e senha errada: nao vale entregar a um
    // desconhecido a informacao de quais e-mails existem na base.
    if (!user || user.password !== password) {
      return this.network.fail('Credenciais inválidas.', ['E-mail ou senha incorretos.']);
    }

    const session = this.toSession(user);
    this.sessions.save(session);

    return this.network.ok(session, `Bem-vindo, ${session.name.split(' ')[0]}.`);
  }

  async logout(): Promise<ApiResponse<null>> {
    this.sessions.clear();
    return this.network.ok(null, 'Sessão encerrada.');
  }

  restoreSession(): Session | null {
    const stored = this.sessions.load();
    if (!stored) return null;

    // O conteudo veio de fora do codigo e pode estar velho ou adulterado. Confere-se o minimo
    // antes de confiar nele.
    return this.users.exists(stored.id, stored.tenantId) ? stored : null;
  }

  private toSession(user: User): Session {
    const { password: _password, ...rest } = user;
    const tenant = this.users.findTenant(user.tenantId);
    return { ...rest, tenantName: tenant?.name ?? 'Empresa' };
  }
}

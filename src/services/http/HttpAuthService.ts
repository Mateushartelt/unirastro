/**
 * Autenticacao pela API real. Guarda sessao e token no ICredentialStore; o token segue em toda
 * requisicao pelo HttpClient, e e dele que o servidor tira empresa e papel.
 */

import type { ApiResponse, Session } from '../../types';
import type { DemoAccount, IAuthService, IDemoAccounts } from '../contracts';
import type { HttpClient } from './HttpClient';
import type { ICredentialStore } from './ports';

export class HttpAuthService implements IAuthService {
  private readonly http: HttpClient;
  private readonly credentials: ICredentialStore;

  constructor(http: HttpClient, credentials: ICredentialStore) {
    this.http = http;
    this.credentials = credentials;
  }

  async login(email: string, password: string): Promise<ApiResponse<Session>> {
    const response = await this.http.post<{ session: Session; token: string }>('/auth/login', {
      email,
      password,
    });
    if (!response.success) return response;

    this.credentials.save(response.data);
    return { ...response, data: response.data.session };
  }

  async logout(): Promise<ApiResponse<null>> {
    const response = await this.http.post<null>('/auth/logout');
    this.credentials.clear();
    return response;
  }

  restoreSession(): Session | null {
    return this.credentials.load()?.session ?? null;
  }
}

/**
 * Contas de demonstracao vindas da API. O contrato e sincrono, entao a lista e carregada uma vez
 * antes da primeira renderizacao (ver composition/container.ts).
 */
export class HttpDemoAccounts implements IDemoAccounts {
  private readonly accounts: DemoAccount[];

  constructor(accounts: DemoAccount[]) {
    this.accounts = accounts;
  }

  static async load(http: HttpClient): Promise<HttpDemoAccounts> {
    const response = await http.get<DemoAccount[]>('/demo-accounts');
    return new HttpDemoAccounts(response.success ? response.data : []);
  }

  list(): DemoAccount[] {
    return this.accounts;
  }
}

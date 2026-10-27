/**
 * Cliente HTTP da API real: fetch + token + leitura do envelope.
 *
 * Nunca lanca excecao. Rede fora do ar, resposta que nao e JSON ou status de erro viram um
 * ApiFailure, exatamente como o backend simulado responde. Assim os servicos HTTP cumprem o
 * contrato inteiro e podem substituir os simulados sem surpresa para as telas (LSP).
 */

import type { ApiFailure, ApiResponse } from '../../types';
import type { ICredentialStore } from './ports';

export class HttpClient {
  private readonly baseUrl: string;
  private readonly credentials: ICredentialStore;
  /** GETs em andamento, por caminho e token. */
  private readonly inFlight = new Map<string, Promise<ApiResponse<unknown>>>();

  constructor(baseUrl: string, credentials: ICredentialStore) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.credentials = credentials;
  }

  /**
   * GET idêntico pedido enquanto outro ainda está em andamento reaproveita a mesma requisição.
   * Acontece quando a tela monta duas vezes (StrictMode do React em desenvolvimento) ou quando
   * duas partes da tela pedem o mesmo dado ao mesmo tempo (barra lateral e página de alertas).
   * Cada chamador recebe sua própria cópia, para um não alterar o objeto do outro.
   */
  async get<T>(path: string): Promise<ApiResponse<T>> {
    const key = `${this.credentials.load()?.token ?? ''} ${path}`;

    let pending = this.inFlight.get(key);
    if (!pending) {
      pending = this.request<unknown>('GET', path).finally(() => this.inFlight.delete(key));
      this.inFlight.set(key, pending);
    }

    return structuredClone(await pending) as ApiResponse<T>;
  }

  post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const token = this.credentials.load()?.token;

    let response: Response;
    try {
      response = await fetch(this.baseUrl + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      return failure('Servidor indisponível.', ['Não foi possível falar com a API.']);
    }

    // Token vencido ou invalido: descarta a credencial para o proximo carregamento ir ao login.
    if (response.status === 401 && token) this.credentials.clear();

    try {
      const json = (await response.json()) as ApiResponse<T>;
      if (typeof json?.success === 'boolean') return json;
    } catch {
      // cai na falha generica abaixo
    }
    return failure('Resposta inesperada da API.', [`HTTP ${response.status}`]);
  }
}

function failure(message: string, errors: string[]): ApiFailure {
  return { success: false, message, errors, data: null };
}

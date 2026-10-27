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

  constructor(baseUrl: string, credentials: ICredentialStore) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.credentials = credentials;
  }

  get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path);
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

/**
 * Sessao e token da API real, guardados no localStorage.
 *
 * Mesmo papel do LocalStorageSessionStorage do backend simulado, com o token junto. Trocar por
 * cookie httpOnly e escrever outra classe que implemente ICredentialStore.
 */

import type { ICredentialStore, StoredCredentials } from '../../services/http/ports';

export class LocalStorageCredentialStore implements ICredentialStore {
  private readonly key: string;

  constructor(key = 'unirastro.credentials') {
    this.key = key;
  }

  load(): StoredCredentials | null {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as StoredCredentials) : null;
    } catch {
      return null;
    }
  }

  save(credentials: StoredCredentials): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(credentials));
    } catch {
      // Navegacao anonima ou armazenamento bloqueado. A sessao vale enquanto a aba viver.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.key);
    } catch {
      // Nada a fazer.
    }
  }
}

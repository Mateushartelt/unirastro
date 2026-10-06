/**
 * Sessao guardada no localStorage do navegador.
 *
 * Saiu de dentro do authService. Guardar sessao e detalhe de infraestrutura: trocar por cookie
 * httpOnly quando o backend existir e escrever outra classe que implemente ISessionStorage.
 */

import type { ISessionStorage } from '../../services/simulated/ports';
import type { Session } from '../../types';

export class LocalStorageSessionStorage implements ISessionStorage {
  private readonly key: string;

  constructor(key = 'unirastro.session') {
    this.key = key;
  }

  load(): Session | null {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }

  save(session: Session): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(session));
    } catch {
      // Navegacao anonima ou armazenamento bloqueado. A sessao vale enquanto a aba viver.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.key);
    } catch {
      // Nada a fazer: se nao deu para gravar, tambem nao havia o que apagar.
    }
  }
}

/**
 * Portas dos servicos HTTP: o que eles precisam do navegador.
 *
 * Guardar credencial e detalhe de infraestrutura (localStorage hoje, cookie amanha). Os servicos
 * HTTP dependem so desta interface, e o adaptador fica em infrastructure/browser (DIP).
 */

import type { Session } from '../../types';

export interface StoredCredentials {
  session: Session;
  token: string;
}

export interface ICredentialStore {
  load(): StoredCredentials | null;
  save(credentials: StoredCredentials): void;
  clear(): void;
}

/**
 * Sessao, papel e empresa ativa (RF10).
 *
 * Equivale ao store de auth do QuizMaster, feito com o Context do proprio React em vez de uma
 * biblioteca de estado. Para uma unica fatia de estado global, uma dependencia a mais nao se
 * justificaria.
 *
 * Recebe o IAuthService por injecao (useServices), em vez de importar o modulo concreto. As
 * permissoes vem da matriz do dominio: uma permissao nova aparece em `can` sem editar este
 * arquivo.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useServices } from '../composition/servicesContext';
import { permissionsFor, type PermissionSet } from '../domain/permissions';
import { responseMessage } from '../services/response';
import type { Session } from '../types';

interface AuthContextValue {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  /** Permissoes derivadas do papel, ja resolvidas para as telas nao repetirem a regra. */
  can: PermissionSet;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useServices();

  // Le a sessao guardada uma unica vez, na montagem. Sem isto a aplicacao pisca a tela de
  // login antes de perceber que ja havia sessao.
  const [session, setSession] = useState<Session | null>(() => auth.restoreSession());

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await auth.login(email, password);

      if (response.success) {
        setSession(response.data);
        return { ok: true, message: response.message };
      }

      return { ok: false, message: responseMessage(response) };
    },
    [auth],
  );

  const signOut = useCallback(async () => {
    await auth.logout();
    setSession(null);
  }, [auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn,
      signOut,
      can: permissionsFor(session?.role ?? null),
    }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  }

  return context;
}

/**
 * Sessao garantida, para telas que so existem apos o login.
 *
 * Evita que cada pagina protegida repita a checagem de nulo que o ProtectedRoute ja fez.
 */
export function useSession(): Session {
  const { session } = useAuth();

  if (!session) {
    throw new Error('useSession foi chamado fora de uma rota protegida.');
  }

  return session;
}

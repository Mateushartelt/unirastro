/**
 * Sessao, papel e empresa ativa (RF10).
 *
 * Equivale ao store de auth do QuizMaster, feito com o Context do proprio React em vez de uma
 * biblioteca de estado. Para uma unica fatia de estado global, uma dependencia a mais nao se
 * justificaria.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authService from '../services/authService';
import type { Session } from '../types';

interface AuthContextValue {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  /** Permissoes derivadas do papel, ja resolvidas para as telas nao repetirem a regra. */
  can: {
    editTriggers: boolean;
    createOrders: boolean;
    resolveIncidents: boolean;
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Le o armazenamento local uma unica vez, na montagem. Sem isto a aplicacao pisca a tela de
  // login antes de perceber que ja havia sessao.
  const [session, setSession] = useState<Session | null>(() => authService.restoreSession());

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await authService.login(email, password);

    if (response.success && response.data) {
      setSession(response.data);
      return { ok: true, message: response.message };
    }

    return { ok: false, message: response.errors[0] ?? response.message };
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn,
      signOut,
      can: {
        editTriggers: session ? authService.canEditTriggers(session.role) : false,
        createOrders: session ? authService.canCreateOrders(session.role) : false,
        resolveIncidents: session ? authService.canResolveIncidents(session.role) : false,
      },
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

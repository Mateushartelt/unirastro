import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppShell } from './AppShell';

/**
 * Porteiro das rotas autenticadas.
 *
 * Guarda o endereco que o usuario tentou abrir e o devolve ao login. Assim quem chega por um
 * link direto para um alerta volta para esse alerta depois de entrar, em vez de cair na tela
 * inicial e ter que procurar de novo.
 */
export function ProtectedRoute() {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <AppShell />;
}

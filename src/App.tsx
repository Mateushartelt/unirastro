import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';
import { AlertsPage } from './pages/alerts/AlertsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrdersPage } from './pages/orders/OrdersPage';

/**
 * Composicao da aplicacao.
 *
 * A ordem dos provedores importa. Auth fica por fora porque tudo depende de haver sessao.
 * Data vem em seguida, e Toast por ultimo, ja que qualquer tela pode emitir um aviso.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/encomendas" element={<OrdersPage />} />
                <Route path="/alertas" element={<AlertsPage />} />
              </Route>

              <Route path="/" element={<Navigate to="/encomendas" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import type { AppServices } from './composition/container';
import { ServicesProvider } from './composition/ServicesProvider';
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
 * A ordem dos provedores importa. Services fica por fora de tudo, porque ate a sessao depende
 * do IAuthService. Auth vem em seguida, porque as telas dependem de haver sessao. Depois Data,
 * e Toast por ultimo, ja que qualquer tela pode emitir um aviso.
 *
 * Os servicos chegam prontos por props, montados em main.tsx pelo composition root. Num teste,
 * basta passar outro objeto AppServices (com dubles) para renderizar a aplicacao inteira.
 */
export default function App({ services }: { services: AppServices }) {
  return (
    <ServicesProvider services={services}>
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
    </ServicesProvider>
  );
}

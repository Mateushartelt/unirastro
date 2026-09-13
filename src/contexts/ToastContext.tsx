/**
 * Avisos flutuantes na base da tela.
 *
 * O design usa um unico aviso por vez, que some sozinho. Confirma acoes sem interromper o
 * fluxo: cadastrou um pedido, resolveu um incidente, alterou um gatilho.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styles from './Toast.module.css';

const TOAST_DURATION_MS = 2600;

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    if (!text) return;

    // Um aviso novo cancela a contagem do anterior, senao o segundo herdaria o tempo restante
    // do primeiro e sumiria cedo demais.
    if (timerRef.current) clearTimeout(timerRef.current);

    setMessage(text);
    timerRef.current = setTimeout(() => setMessage(''), TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message && (
        <div className={styles.toast} role="status" aria-live="polite">
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  }

  return context;
}

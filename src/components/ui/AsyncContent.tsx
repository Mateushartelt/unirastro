import type { ReactNode } from 'react';
import { ErrorState, LoadingState } from './Feedback';

interface AsyncContentProps {
  loading: boolean;
  error: string;
  loadingMessage: string;
  children: ReactNode;
}

/** Mostra erro ou carregamento enquanto os dados nao chegam; depois, o conteudo. */
export function AsyncContent({ loading, error, loadingMessage, children }: Readonly<AsyncContentProps>) {
  if (error) return <ErrorState message={error} />;
  if (loading) return <LoadingState message={loadingMessage} />;
  return <>{children}</>;
}

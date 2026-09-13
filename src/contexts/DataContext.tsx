/**
 * Sincronizacao entre telas apos uma alteracao.
 *
 * O problema concreto: resolver um incidente na central precisa atualizar tambem a contagem
 * ao lado de "Alertas" na barra lateral, que e outro componente, em outro ramo da arvore.
 *
 * A solucao e um contador compartilhado. Quem altera dados chama `invalidate`, e todo efeito
 * que depende de `version` recarrega. E o mesmo papel que a invalidacao de cache cumpre numa
 * biblioteca de dados, sem trazer a biblioteca para um projeto deste tamanho.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface DataContextValue {
  version: number;
  invalidate: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);

  const invalidate = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo(() => ({ version, invalidate }), [version, invalidate]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error('useData precisa estar dentro de <DataProvider>.');
  }

  return context;
}

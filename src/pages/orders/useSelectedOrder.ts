import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { OrderWithAnomalies } from '../../types';

/**
 * Encomenda aberta na gaveta. O codigo vive na URL (?codigo=), e nao em estado local: assim a
 * central de alertas pode abrir uma encomenda com um link, e recarregar mantem a gaveta aberta.
 */
export function useSelectedOrder(orders: OrderWithAnomalies[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCode = searchParams.get('codigo');

  const selected = useMemo(
    () => orders.find((o) => o.code === selectedCode) ?? null,
    [orders, selectedCode],
  );

  const select = useCallback(
    (code: string | null) => setSearchParams(code ? { codigo: code } : {}, { replace: true }),
    [setSearchParams],
  );

  return { selectedCode, selected, select };
}

import { useServices } from '../../composition/servicesContext';
import { useSession } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { responseMessage } from '../../services/response';
import type { ApiResponse } from '../../types';

/**
 * Acoes da central de incidentes. Todas seguem o mesmo roteiro: chama o servico, avisa e,
 * se deu certo, recarrega tudo que observa o DataContext (a contagem da barra lateral e, no
 * caso dos gatilhos, os incidentes, porque o gatilho decide se cada um aparece como notificado).
 */
export function useAlertActions() {
  const session = useSession();
  const { showToast } = useToast();
  const { invalidate } = useData();
  const { incidents, triggers } = useServices();

  async function run(action: Promise<ApiResponse<unknown>>) {
    const response = await action;
    showToast(responseMessage(response));
    if (response.success) invalidate();
  }

  return {
    resolve: (id: string) => run(incidents.resolve(session.tenantId, id)),
    reopen: (id: string) => run(incidents.reopen(session.tenantId, id)),
    toggleTrigger: (id: string) => run(triggers.toggle(id)),
  };
}

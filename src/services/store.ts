/**
 * Armazenamento em memoria que faz as vezes do banco de dados.
 *
 * Vive fora dos componentes de proposito. Se este estado morasse num contexto do React, cada
 * remontagem de tela o reiniciaria e a aplicacao pareceria esquecer o que o usuario acabou de
 * fazer. Mantendo-o aqui, um pedido cadastrado continua na lista depois de navegar para os
 * alertas e voltar — que e como um backend se comporta.
 *
 * O preco e que os dados voltam ao estado inicial quando a pagina e recarregada. Para uma
 * entrega de frontend isso e aceitavel, e ate conveniente numa apresentacao.
 */

import { MOCK_SYSTEM_INCIDENTS } from '../mocks/incidents';
import { MOCK_ORDERS } from '../mocks/orders';
import { MOCK_TRIGGERS } from '../mocks/triggers';
import type { Incident, NotificationTrigger, Order } from '../types';

interface Store {
  orders: Order[];
  triggers: NotificationTrigger[];
  systemIncidents: Incident[];
  /** Ids de incidentes que o operador marcou como resolvidos nesta sessao. */
  resolvedIncidentIds: Set<string>;
  /** Momento da ultima consulta as APIs das transportadoras (RF02). */
  lastSyncAt: string;
  /** Eventos aguardando processamento na fila, exibido na barra lateral. */
  queueSize: number;
}

export const store: Store = {
  orders: structuredClone(MOCK_ORDERS),
  triggers: structuredClone(MOCK_TRIGGERS),
  systemIncidents: structuredClone(MOCK_SYSTEM_INCIDENTS),
  resolvedIncidentIds: new Set(
    MOCK_SYSTEM_INCIDENTS.filter((i) => i.resolved).map((i) => i.id),
  ),
  lastSyncAt: new Date().toISOString(),
  queueSize: 128,
};

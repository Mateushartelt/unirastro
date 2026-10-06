/**
 * Gatilhos de notificacao (RF05), no backend simulado.
 *
 * Separado da central de incidentes: sao dois motivos de mudanca diferentes. Uma regra nova de
 * anomalia nao deveria tocar no codigo que liga e desliga gatilhos, e vice-versa.
 */

import type { ApiResponse, NotificationTrigger } from '../../types';
import type { ITriggersService } from '../contracts';
import type { ITriggerRepository } from './ports';
import type { SimulatedNetwork } from './SimulatedNetwork';

export class SimulatedTriggersService implements ITriggersService {
  private readonly triggers: ITriggerRepository;
  private readonly network: SimulatedNetwork;

  constructor(triggers: ITriggerRepository, network: SimulatedNetwork) {
    this.triggers = triggers;
    this.network = network;
  }

  async list(): Promise<ApiResponse<NotificationTrigger[]>> {
    return this.network.ok(this.triggers.list());
  }

  async toggle(id: string): Promise<ApiResponse<NotificationTrigger[]>> {
    const trigger = this.triggers.findById(id);

    if (!trigger) {
      return this.network.fail('Gatilho não encontrado.', [
        `Nenhum gatilho com o identificador ${id}.`,
      ]);
    }

    const updated = { ...trigger, enabled: !trigger.enabled };
    this.triggers.update(updated);

    return this.network.ok(
      this.triggers.list(),
      `Gatilho "${updated.label}" ${updated.enabled ? 'ativado' : 'desativado'}`,
    );
  }
}

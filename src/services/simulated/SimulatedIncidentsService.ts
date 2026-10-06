/**
 * Central de incidentes (RF04, RF06), no backend simulado.
 *
 * Antes, alertsService.ts juntava incidentes e gatilhos no mesmo modulo, guardava a regra de
 * ordenacao, a politica de notificacao e lia o store global. Agora:
 *  - gatilhos tem servico proprio (SimulatedTriggersService);
 *  - derivacao e ordenacao sao funcoes puras em domain/incidents;
 *  - a politica "o cliente foi avisado?" e o NotificationPolicy;
 *  - os dados chegam por portas injetadas.
 */

import type { AnomalyDetector } from '../../domain/anomalies/AnomalyDetector';
import { compareIncidents, incidentsFromOrder } from '../../domain/incidents/incidents';
import type { NotificationPolicy } from '../../domain/incidents/NotificationPolicy';
import type { ApiResponse, Incident, TenantId } from '../../types';
import type { IIncidentsService } from '../contracts';
import type {
  IIncidentResolutionRepository,
  IOrderRepository,
  ISystemIncidentRepository,
  ITriggerRepository,
} from './ports';
import type { SimulatedNetwork } from './SimulatedNetwork';

export interface IncidentsServiceDeps {
  orders: IOrderRepository;
  systemIncidents: ISystemIncidentRepository;
  resolutions: IIncidentResolutionRepository;
  triggers: ITriggerRepository;
  anomalies: AnomalyDetector;
  notifications: NotificationPolicy;
  network: SimulatedNetwork;
}

export class SimulatedIncidentsService implements IIncidentsService {
  private readonly deps: IncidentsServiceDeps;

  constructor(deps: IncidentsServiceDeps) {
    this.deps = deps;
  }

  async list(tenantId: TenantId): Promise<ApiResponse<Incident[]>> {
    const { orders, systemIncidents, resolutions, triggers, anomalies, notifications } = this.deps;

    const now = new Date();
    const activeTriggers = triggers.list();
    const context = {
      now,
      isResolved: (id: string) => resolutions.isResolved(tenantId, id),
      wasNotified: (rule: string) => notifications.wasNotified(rule, activeTriggers),
    };

    const derived = orders
      .listByTenant(tenantId)
      .flatMap((order) => incidentsFromOrder(order, anomalies.detect(order, now), context));

    const system = systemIncidents
      .listByTenant(tenantId)
      .map((i) => ({ ...i, resolved: context.isResolved(i.id) }));

    return this.deps.network.ok([...derived, ...system].sort(compareIncidents));
  }

  async resolve(tenantId: TenantId, id: string): Promise<ApiResponse<null>> {
    this.deps.resolutions.markResolved(tenantId, id);
    return this.deps.network.ok(null, 'Incidente marcado como resolvido');
  }

  async reopen(tenantId: TenantId, id: string): Promise<ApiResponse<null>> {
    this.deps.resolutions.reopen(tenantId, id);
    return this.deps.network.ok(null, 'Incidente reaberto');
  }
}

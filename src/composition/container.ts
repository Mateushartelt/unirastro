/**
 * Composition root: o unico lugar que conhece as classes concretas.
 *
 * Aqui se decide quais regras de anomalia existem, de onde vem cada dado, quanto de latencia
 * simular e qual implementacao atende cada contrato. O resto da aplicacao recebe interfaces.
 *
 * A troca entre o backend simulado e a API real acontece so neste arquivo: com VITE_API_URL
 * definido, `createServices` monta HttpOrdersService, HttpIncidentsService etc.; sem ele, os
 * Simulated*Service. Nenhuma tela ou contexto muda (OCP + DIP).
 *
 * Para criar uma regra de anomalia nova: escrever a classe em domain/anomalies/rules e
 * acrescenta-la em ANOMALY_RULES abaixo. So isso.
 */

import { AnomalyDetector } from '../domain/anomalies/AnomalyDetector';
import type { AnomalyRule } from '../domain/anomalies/AnomalyRule';
import { PredictiveDelayRiskRule } from '../domain/anomalies/rules/PredictiveDelayRiskRule';
import { RepeatedFailedAttemptsRule } from '../domain/anomalies/rules/RepeatedFailedAttemptsRule';
import { RouteDeviationRule } from '../domain/anomalies/rules/RouteDeviationRule';
import { StalledInTransitRule } from '../domain/anomalies/rules/StalledInTransitRule';
import { CarrierDetector } from '../domain/carriers/CarrierDetector';
import { CARRIER_PATTERNS } from '../domain/carriers/carrierPatterns';
import { NotificationPolicy } from '../domain/incidents/NotificationPolicy';
import { LocalStorageCredentialStore } from '../infrastructure/browser/LocalStorageCredentialStore';
import { LocalStorageSessionStorage } from '../infrastructure/browser/LocalStorageSessionStorage';
import { SimulatedCarrierGateway } from '../infrastructure/carriers/SimulatedCarrierGateway';
import { InMemoryIncidentResolutionRepository } from '../infrastructure/memory/InMemoryIncidentResolutionRepository';
import { InMemoryOrderRepository } from '../infrastructure/memory/InMemoryOrderRepository';
import { InMemorySystemIncidentRepository } from '../infrastructure/memory/InMemorySystemIncidentRepository';
import { InMemoryTriggerRepository } from '../infrastructure/memory/InMemoryTriggerRepository';
import { InMemoryWorkerMonitor } from '../infrastructure/memory/InMemoryWorkerMonitor';
import { MockUserDirectory } from '../infrastructure/memory/MockUserDirectory';
import { MOCK_SYSTEM_INCIDENTS } from '../mocks/incidents';
import { MOCK_ORDERS } from '../mocks/orders';
import { MOCK_TRIGGERS } from '../mocks/triggers';
import { MOCK_TENANTS, MOCK_USERS } from '../mocks/users';
import type {
  IAuthService,
  ICarrierDetection,
  IDemoAccounts,
  IIncidentsService,
  IOrdersService,
  ITriggersService,
  IWorkerStatusService,
} from '../services/contracts';
import { HttpAuthService, HttpDemoAccounts } from '../services/http/HttpAuthService';
import { HttpClient } from '../services/http/HttpClient';
import { HttpIncidentsService } from '../services/http/HttpIncidentsService';
import { HttpOrdersService } from '../services/http/HttpOrdersService';
import { HttpTriggersService } from '../services/http/HttpTriggersService';
import { HttpWorkerStatusService } from '../services/http/HttpWorkerStatusService';
import { SimulatedAuthService } from '../services/simulated/SimulatedAuthService';
import { SimulatedIncidentsService } from '../services/simulated/SimulatedIncidentsService';
import { SimulatedNetwork, type LatencyRange } from '../services/simulated/SimulatedNetwork';
import { SimulatedOrdersService } from '../services/simulated/SimulatedOrdersService';
import { SimulatedTriggersService } from '../services/simulated/SimulatedTriggersService';
import { SimulatedWorkerStatusService } from '../services/simulated/SimulatedWorkerStatusService';

/** Tudo o que a interface pode usar. Somente contratos, nenhuma classe concreta. */
export interface AppServices {
  auth: IAuthService;
  demoAccounts: IDemoAccounts;
  orders: IOrdersService;
  incidents: IIncidentsService;
  triggers: ITriggersService;
  workerStatus: IWorkerStatusService;
  carrierDetection: ICarrierDetection;
}

/** Regras de anomalia ativas (RF04). A ordem desempata anomalias de mesma severidade. */
const ANOMALY_RULES: readonly AnomalyRule[] = [
  new StalledInTransitRule(),
  new RepeatedFailedAttemptsRule(),
  new RouteDeviationRule(),
  new PredictiveDelayRiskRule(),
];

const DEFAULT_LATENCY: LatencyRange = { minMs: 300, maxMs: 600 };

/**
 * Monta os servicos da aplicacao. Assincrono porque, com a API real, as contas de demonstracao
 * precisam ser carregadas antes da primeira renderizacao.
 */
export async function createServices(
  apiUrl: string | undefined = import.meta.env.VITE_API_URL,
): Promise<AppServices> {
  return apiUrl ? createHttpServices(apiUrl) : createSimulatedServices();
}

/** Servicos que falam com a API Express em backend/. */
async function createHttpServices(apiUrl: string): Promise<AppServices> {
  const credentials = new LocalStorageCredentialStore();
  const http = new HttpClient(apiUrl, credentials);

  return {
    auth: new HttpAuthService(http, credentials),
    demoAccounts: await HttpDemoAccounts.load(http),
    orders: new HttpOrdersService(http),
    incidents: new HttpIncidentsService(http),
    triggers: new HttpTriggersService(http),
    workerStatus: new HttpWorkerStatusService(http),
    // Deteccao local continua no cliente: retorno instantaneo enquanto se digita.
    carrierDetection: new CarrierDetector(CARRIER_PATTERNS),
  };
}

function createSimulatedRepositories() {
  return {
    orders: new InMemoryOrderRepository(MOCK_ORDERS),
    triggers: new InMemoryTriggerRepository(MOCK_TRIGGERS),
    systemIncidents: new InMemorySystemIncidentRepository(MOCK_SYSTEM_INCIDENTS),
    resolutions: new InMemoryIncidentResolutionRepository(
      MOCK_SYSTEM_INCIDENTS.filter((i) => i.resolved),
    ),
    workers: new InMemoryWorkerMonitor({ lastSyncAt: new Date(), queueSize: 128 }),
    users: new MockUserDirectory(MOCK_USERS, MOCK_TENANTS),
  };
}

/** Backend simulado em memoria, usado quando nao ha API configurada. */
export function createSimulatedServices(latency: LatencyRange = DEFAULT_LATENCY): AppServices {
  const anomalies = new AnomalyDetector(ANOMALY_RULES);
  const carriers = new CarrierDetector(CARRIER_PATTERNS);
  const network = new SimulatedNetwork(latency);
  const repos = createSimulatedRepositories();

  return {
    auth: new SimulatedAuthService(repos.users, new LocalStorageSessionStorage(), network),
    demoAccounts: repos.users,
    orders: new SimulatedOrdersService({
      orders: repos.orders,
      tracking: new SimulatedCarrierGateway(),
      workers: repos.workers,
      anomalies,
      carriers,
      network,
    }),
    incidents: new SimulatedIncidentsService({
      orders: repos.orders,
      systemIncidents: repos.systemIncidents,
      resolutions: repos.resolutions,
      triggers: repos.triggers,
      anomalies,
      notifications: new NotificationPolicy(ANOMALY_RULES),
      network,
    }),
    triggers: new SimulatedTriggersService(repos.triggers, network),
    workerStatus: new SimulatedWorkerStatusService(repos.workers, network),
    carrierDetection: carriers,
  };
}

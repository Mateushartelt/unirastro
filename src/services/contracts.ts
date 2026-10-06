/**
 * Contratos da fronteira com o backend (RNF01, Cliente-Servidor).
 *
 * As telas e contextos dependem SOMENTE destas interfaces (DIP). Nesta entrega quem as
 * implementa e o backend simulado em services/simulated; quando a API existir, entram classes
 * Http*Service que implementam as mesmas interfaces, e o composition root troca uma pela
 * outra. Nenhuma tela muda (OCP).
 *
 * Antes, as telas importavam os modulos concretos (`import * as authService`), e a LoginPage
 * chegava a importar direto de mocks/. Era impossivel trocar a implementacao sem editar tela.
 *
 * Uma interface por papel, em vez de um "IApiService" unico (ISP): a AppShell so precisa de
 * IWorkerStatusService e de IIncidentsService, e nao deveria depender de cadastro de pedido.
 */

import type { NewOrderInput } from '../domain/orders/newOrder';
import type {
  ApiResponse,
  Carrier,
  Incident,
  NotificationTrigger,
  OrderWithAnomalies,
  Role,
  Session,
  TenantId,
} from '../types';

export interface IAuthService {
  login(email: string, password: string): Promise<ApiResponse<Session>>;
  logout(): Promise<ApiResponse<null>>;
  /**
   * Sessao guardada, lida na inicializacao. Sincrona de proposito: o roteador precisa saber se
   * ha sessao antes da primeira renderizacao, senao a aplicacao pisca a tela de login.
   */
  restoreSession(): Session | null;
}

/** Contas de demonstracao mostradas na tela de login. Some quando o backend real entrar. */
export interface DemoAccount {
  email: string;
  password: string;
  role: Role;
  tenant: string;
}

export interface IDemoAccounts {
  list(): DemoAccount[];
}

export interface IOrdersService {
  list(tenantId: TenantId): Promise<ApiResponse<OrderWithAnomalies[]>>;
  get(tenantId: TenantId, code: string): Promise<ApiResponse<OrderWithAnomalies>>;
  create(tenantId: TenantId, input: NewOrderInput): Promise<ApiResponse<OrderWithAnomalies>>;
  /** Consulta de status sob demanda (RF02). */
  refresh(tenantId: TenantId, code: string): Promise<ApiResponse<OrderWithAnomalies>>;
}

export interface IIncidentsService {
  list(tenantId: TenantId): Promise<ApiResponse<Incident[]>>;
  resolve(tenantId: TenantId, id: string): Promise<ApiResponse<null>>;
  reopen(tenantId: TenantId, id: string): Promise<ApiResponse<null>>;
}

export interface ITriggersService {
  list(): Promise<ApiResponse<NotificationTrigger[]>>;
  toggle(id: string): Promise<ApiResponse<NotificationTrigger[]>>;
}

export interface WorkerStatus {
  lastSyncAt: string;
  queueSize: number;
}

export interface IWorkerStatusService {
  get(): Promise<ApiResponse<WorkerStatus>>;
}

/**
 * Deteccao local da transportadora, para o retorno instantaneo enquanto se digita (RF01). E
 * regra pura, sem rede, entao continua no cliente mesmo com backend real. Quem implementa e o
 * CarrierDetector do dominio (compatibilidade estrutural do TypeScript).
 */
export interface ICarrierDetection {
  detect(code: string): Carrier | null;
  supportedFormats(): string[];
}

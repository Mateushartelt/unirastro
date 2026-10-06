/**
 * Portas do backend simulado: o que os servicos precisam da infraestrutura.
 *
 * Antes todos os servicos liam e escreviam num objeto global unico (services/store.ts), e o
 * authService lia mocks/ direto. Agora cada servico declara so a fatia que usa, e os
 * adaptadores em infrastructure/ implementam essas interfaces. Trocar memoria por banco, ou
 * localStorage por cookie, e escrever outro adaptador (DIP + ISP).
 *
 * As interfaces sao pequenas e separadas por papel. O monitor dos workers, por exemplo, tem
 * uma porta de escrita (quem registra atividade) e outra de leitura (quem exibe status).
 */

import type { Incident, NotificationTrigger, Order, Session, TenantId, Tenant, User } from '../../types';

export interface IOrderRepository {
  listByTenant(tenantId: TenantId): Order[];
  findByCode(tenantId: TenantId, code: string): Order | null;
  add(order: Order): void;
  update(order: Order): void;
}

export interface ITriggerRepository {
  list(): NotificationTrigger[];
  findById(id: string): NotificationTrigger | null;
  update(trigger: NotificationTrigger): void;
}

/** Incidentes de infraestrutura, os unicos que existem como registro e nao sao derivados. */
export interface ISystemIncidentRepository {
  listByTenant(tenantId: TenantId): Incident[];
}

/** A decisao humana sobre incidentes: quais foram marcados como resolvidos. */
export interface IIncidentResolutionRepository {
  isResolved(tenantId: TenantId, id: string): boolean;
  markResolved(tenantId: TenantId, id: string): void;
  reopen(tenantId: TenantId, id: string): void;
}

export interface IUserDirectory {
  findByEmail(email: string): User | null;
  exists(userId: string, tenantId: TenantId): boolean;
  findTenant(tenantId: TenantId): Tenant | null;
}

export interface ISessionStorage {
  load(): Session | null;
  save(session: Session): void;
  clear(): void;
}

/** Proxima movimentacao devolvida pela transportadora, ou null quando nao ha novidade. */
export interface TrackingUpdate {
  event: Order['timeline'][number];
  status: Order['status'];
}

/** Integracao com as APIs das transportadoras (C1/C2: "APIs das Transportadoras"). */
export interface ICarrierTrackingGateway {
  fetchUpdate(order: Order): TrackingUpdate | null;
}

export interface IWorkerActivityRecorder {
  recordSync(at: Date): void;
  enqueue(count?: number): void;
}

export interface IWorkerStatusReader {
  status(): { lastSyncAt: string; queueSize: number };
}

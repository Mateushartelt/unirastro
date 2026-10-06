/**
 * Decisoes "resolvido" do operador, em memoria (fatia `resolvedIncidentIds` do antigo store).
 *
 * A chave inclui o tenant. Antes, resolver um incidente gravava so o id, e um id igual em
 * outra empresa seria marcado junto.
 */

import type { IIncidentResolutionRepository } from '../../services/simulated/ports';
import type { TenantId } from '../../types';

export interface ResolvedIncidentSeed {
  tenantId: TenantId;
  id: string;
}

export class InMemoryIncidentResolutionRepository implements IIncidentResolutionRepository {
  private readonly resolved = new Set<string>();

  constructor(seed: readonly ResolvedIncidentSeed[] = []) {
    seed.forEach(({ tenantId, id }) => this.resolved.add(key(tenantId, id)));
  }

  isResolved(tenantId: TenantId, id: string): boolean {
    return this.resolved.has(key(tenantId, id));
  }

  markResolved(tenantId: TenantId, id: string): void {
    this.resolved.add(key(tenantId, id));
  }

  reopen(tenantId: TenantId, id: string): void {
    this.resolved.delete(key(tenantId, id));
  }
}

function key(tenantId: TenantId, id: string): string {
  return `${tenantId}|${id}`;
}

/**
 * Decisoes "resolvido" do operador, em memoria (fatia `resolvedIncidentIds` do antigo store).
 *
 * A chave inclui o tenant. Antes, resolver um incidente gravava so o id, e um id igual em
 * outra empresa seria marcado junto.
 */

import type { IIncidentResolutionRepository } from '../../services/simulated/ports';

export interface ResolvedIncidentSeed {
  tenantId: string;
  id: string;
}

export class InMemoryIncidentResolutionRepository implements IIncidentResolutionRepository {
  private readonly resolved = new Set<string>();

  constructor(seed: readonly ResolvedIncidentSeed[] = []) {
    seed.forEach(({ tenantId, id }) => this.resolved.add(key(tenantId, id)));
  }

  isResolved(tenantId: string, id: string): boolean {
    return this.resolved.has(key(tenantId, id));
  }

  markResolved(tenantId: string, id: string): void {
    this.resolved.add(key(tenantId, id));
  }

  reopen(tenantId: string, id: string): void {
    this.resolved.delete(key(tenantId, id));
  }
}

function key(tenantId: string, id: string): string {
  return `${tenantId}|${id}`;
}

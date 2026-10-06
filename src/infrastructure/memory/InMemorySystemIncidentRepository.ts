/** Incidentes de infraestrutura em memoria (fatia `systemIncidents` do antigo store global). */

import type { ISystemIncidentRepository } from '../../services/simulated/ports';
import type { Incident, TenantId } from '../../types';

export class InMemorySystemIncidentRepository implements ISystemIncidentRepository {
  private readonly incidents: Incident[];

  constructor(seed: readonly Incident[]) {
    this.incidents = structuredClone([...seed]);
  }

  listByTenant(tenantId: TenantId): Incident[] {
    return this.incidents.filter((i) => i.tenantId === tenantId);
  }
}

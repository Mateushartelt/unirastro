/** Central de incidentes pela API real. O tenant vem do token, como em HttpOrdersService. */

import type { ApiResponse, Incident, TenantId } from '../../types';
import type { IIncidentsService } from '../contracts';
import type { HttpClient } from './HttpClient';

export class HttpIncidentsService implements IIncidentsService {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  list(_tenantId: TenantId): Promise<ApiResponse<Incident[]>> {
    return this.http.get('/incidentes');
  }

  resolve(_tenantId: TenantId, id: string): Promise<ApiResponse<null>> {
    return this.http.post(`/incidentes/${encodeURIComponent(id)}/resolver`);
  }

  reopen(_tenantId: TenantId, id: string): Promise<ApiResponse<null>> {
    return this.http.post(`/incidentes/${encodeURIComponent(id)}/reabrir`);
  }
}

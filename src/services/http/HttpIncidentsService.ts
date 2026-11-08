/** Central de incidentes pela API real. O tenant vem do token, como em HttpOrdersService. */

import type { ApiResponse, Incident } from '../../types';
import type { IIncidentsService } from '../contracts';
import type { HttpClient } from './HttpClient';

export class HttpIncidentsService implements IIncidentsService {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  list(_tenantId: string): Promise<ApiResponse<Incident[]>> {
    return this.http.get('/incidentes');
  }

  resolve(_tenantId: string, id: string): Promise<ApiResponse<null>> {
    return this.http.post(`/incidentes/${encodeURIComponent(id)}/resolver`);
  }

  reopen(_tenantId: string, id: string): Promise<ApiResponse<null>> {
    return this.http.post(`/incidentes/${encodeURIComponent(id)}/reabrir`);
  }
}

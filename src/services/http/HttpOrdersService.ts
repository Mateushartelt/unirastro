/**
 * Encomendas pela API real (POST /api/encomendas e companhia).
 *
 * O `tenantId` do contrato nao vai na requisicao: o servidor le a empresa do token. Mandar o
 * tenant pelo cliente seria confiar no cliente para isolar dados (RF10).
 */

import type { NewOrderInput } from '../../domain/orders/newOrder';
import type { ApiResponse, OrderWithAnomalies, TenantId } from '../../types';
import type { IOrdersService } from '../contracts';
import type { HttpClient } from './HttpClient';

export class HttpOrdersService implements IOrdersService {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  list(_tenantId: TenantId): Promise<ApiResponse<OrderWithAnomalies[]>> {
    return this.http.get('/encomendas');
  }

  get(_tenantId: TenantId, code: string): Promise<ApiResponse<OrderWithAnomalies>> {
    return this.http.get(`/encomendas/${encodeURIComponent(code)}`);
  }

  create(_tenantId: TenantId, input: NewOrderInput): Promise<ApiResponse<OrderWithAnomalies>> {
    return this.http.post('/encomendas', input);
  }

  refresh(_tenantId: TenantId, code: string): Promise<ApiResponse<OrderWithAnomalies>> {
    return this.http.post(`/encomendas/${encodeURIComponent(code)}/consultar`);
  }
}

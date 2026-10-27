/** Gatilhos de notificacao pela API real. */

import type { ApiResponse, NotificationTrigger } from '../../types';
import type { ITriggersService } from '../contracts';
import type { HttpClient } from './HttpClient';

export class HttpTriggersService implements ITriggersService {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  list(): Promise<ApiResponse<NotificationTrigger[]>> {
    return this.http.get('/gatilhos');
  }

  toggle(id: string): Promise<ApiResponse<NotificationTrigger[]>> {
    return this.http.patch(`/gatilhos/${encodeURIComponent(id)}`);
  }
}

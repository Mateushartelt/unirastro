/** Status dos workers de rastreio pela API real. */

import type { ApiResponse } from '../../types';
import type { IWorkerStatusService, WorkerStatus } from '../contracts';
import type { HttpClient } from './HttpClient';

export class HttpWorkerStatusService implements IWorkerStatusService {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  get(): Promise<ApiResponse<WorkerStatus>> {
    return this.http.get('/workers/status');
  }
}

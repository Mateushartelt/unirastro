/**
 * Situacao dos workers de rastreio, exibida na barra lateral.
 *
 * Antes era `getWorkerStatus()` dentro de ordersService.ts. Status de worker nao e encomenda,
 * entao ganhou servico proprio, que so le (IWorkerStatusReader).
 */

import type { ApiResponse } from '../../types';
import type { IWorkerStatusService, WorkerStatus } from '../contracts';
import type { IWorkerStatusReader } from './ports';
import type { SimulatedNetwork } from './SimulatedNetwork';

export class SimulatedWorkerStatusService implements IWorkerStatusService {
  private readonly reader: IWorkerStatusReader;
  private readonly network: SimulatedNetwork;

  constructor(reader: IWorkerStatusReader, network: SimulatedNetwork) {
    this.reader = reader;
    this.network = network;
  }

  async get(): Promise<ApiResponse<WorkerStatus>> {
    return this.network.ok(this.reader.status());
  }
}

/**
 * Atividade dos workers de rastreio, em memoria (fatias `lastSyncAt` e `queueSize` do antigo
 * store).
 *
 * Implementa duas portas pequenas em vez de uma grande (ISP): o servico de encomendas so
 * registra atividade, e o servico de status so le.
 */

import type {
  IWorkerActivityRecorder,
  IWorkerStatusReader,
} from '../../services/simulated/ports';

export class InMemoryWorkerMonitor implements IWorkerActivityRecorder, IWorkerStatusReader {
  private lastSyncAt: string;
  private queueSize: number;

  constructor(initial: { lastSyncAt: Date; queueSize: number }) {
    this.lastSyncAt = initial.lastSyncAt.toISOString();
    this.queueSize = initial.queueSize;
  }

  recordSync(at: Date): void {
    this.lastSyncAt = at.toISOString();
  }

  enqueue(count = 1): void {
    this.queueSize += count;
  }

  status(): { lastSyncAt: string; queueSize: number } {
    return { lastSyncAt: this.lastSyncAt, queueSize: this.queueSize };
  }
}

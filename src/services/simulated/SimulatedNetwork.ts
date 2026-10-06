/**
 * "Rede" do backend simulado: envelope de resposta + latencia artificial.
 *
 * Substitui o antigo services/client.ts. Virou classe injetavel para que a latencia seja
 * configurada no composition root (zero em testes, 300 a 600 ms na apresentacao), em vez de
 * fixa dentro de cada servico.
 *
 * A latencia existe para que a interface exercite estados de carregamento de verdade. Uma
 * tela que nunca espera esconde exatamente os defeitos que aparecem quando o backend entra. E
 * o RNF03 fala em consistencia eventual, entao esperar e o comportamento normal.
 */

import type { ApiFailure, ApiSuccess } from '../../types';

export interface LatencyRange {
  minMs: number;
  maxMs: number;
}

export class SimulatedNetwork {
  private readonly latency: LatencyRange;

  constructor(latency: LatencyRange) {
    this.latency = latency;
  }

  /**
   * Resposta bem sucedida, apos a espera simulada. Devolve uma copia profunda: uma API real
   * devolveria JSON novo a cada chamada, e sem a copia uma tela que alterasse o objeto
   * recebido corromperia o "banco" simulado.
   */
  async ok<T>(data: T, message = ''): Promise<ApiSuccess<T>> {
    await this.wait();
    return { success: true, message, errors: [], data: structuredClone(data) };
  }

  /** Resposta de falha. Erros tambem esperam: uma falha instantanea seria irreal. */
  async fail(message: string, errors: string[] = []): Promise<ApiFailure> {
    await this.wait();
    return { success: false, message, errors, data: null };
  }

  private wait(): Promise<void> {
    const { minMs, maxMs } = this.latency;
    const ms = minMs + Math.random() * (maxMs - minMs);
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Cliente compartilhado dos servicos simulados.
 *
 * Equivale ao services/api.js do QuizMaster, que configura o Axios uma vez e o entrega pronto
 * aos demais servicos. Aqui nao ha rede, mas a fronteira e a mesma: nenhuma tela conhece a
 * origem do dado, so este modulo conhece.
 *
 * Duas decisoes valem explicacao.
 *
 * A latencia artificial existe para que a interface exercite estados de carregamento de
 * verdade. Uma tela que nunca espera esconde exatamente os defeitos que aparecem quando o
 * backend entra. E o RNF03 fala em consistencia eventual, entao esperar e o comportamento
 * normal, nao a excecao.
 *
 * O envelope `success`, `message`, `errors` e `data` e o mesmo que o quizmaster-api devolve.
 * Manter a simetria significa que trocar isto por `fetch` depois nao mexe em como as telas
 * leem a resposta.
 */

import type { ApiResponse } from '../types';

const MIN_LATENCY_MS = 300;
const MAX_LATENCY_MS = 600;

function randomLatency(): number {
  return MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resposta bem sucedida, apos a espera simulada. */
export async function ok<T>(data: T, message = ''): Promise<ApiResponse<T>> {
  await delay(randomLatency());
  return { success: true, message, errors: [], data };
}

/**
 * Resposta de falha.
 *
 * Erros tambem esperam. Uma falha instantanea seria irreal e esconderia o estado de
 * carregamento que a tela precisa tratar.
 */
export async function fail<T>(
  message: string,
  errors: string[] = [],
  data: T = null as T,
): Promise<ApiResponse<T>> {
  await delay(randomLatency());
  return { success: false, message, errors, data };
}

/**
 * Copia profunda para devolver dados independentes do armazenamento em memoria.
 *
 * Sem isto, uma tela que alterasse o objeto recebido corromperia o "banco" simulado, e o bug
 * so apareceria em outra tela, longe da causa. Uma API real devolveria JSON novo a cada
 * chamada, e esta funcao preserva essa propriedade.
 */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

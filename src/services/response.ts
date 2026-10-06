/**
 * Leitura do envelope de resposta pelas telas.
 *
 * O trecho `response.errors[0] ?? response.message` aparecia repetido em cada pagina.
 */

import type { ApiResponse } from '../types';

/** Mensagem mais util para exibir: o primeiro erro especifico, ou a mensagem geral. */
export function responseMessage(response: ApiResponse<unknown>): string {
  if (response.success) return response.message;
  return response.errors[0] ?? response.message;
}

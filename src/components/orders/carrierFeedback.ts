/**
 * Linha de retorno sob o campo de codigo (RF01). O design define tres situacoes: aguardando,
 * identificada e nao reconhecida.
 *
 * Estava em lib/carrierDetection.ts, junto da regra de deteccao. Texto de tela nao e regra de
 * negocio: o dominio responde "qual transportadora", e este modulo decide como dizer isso.
 */

import type { Carrier } from '../../types';

export type DetectionStatus = 'idle' | 'detected' | 'unknown';

export interface DetectionFeedback {
  status: DetectionStatus;
  message: string;
}

export function describeDetection(input: string, carrier: Carrier | null): DetectionFeedback {
  if (!input.trim()) {
    return { status: 'idle', message: 'Aguardando código…' };
  }

  if (carrier) {
    return { status: 'detected', message: `Transportadora identificada: ${carrier}` };
  }

  return { status: 'unknown', message: 'Formato não reconhecido pelas transportadoras integradas' };
}

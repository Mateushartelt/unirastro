/**
 * RF01 — identificacao automatica da transportadora a partir do codigo de rastreio.
 *
 * As expressoes abaixo vieram do prototipo do design e cobrem as quatro transportadoras
 * integradas nesta fase.
 *
 * Importante para a defesa: sao aproximacoes didaticas. Formatos reais mudam, se sobrepoem
 * entre operadores e admitem variacoes que nao estao representadas aqui. Em producao o
 * palpite do formato serviria apenas para escolher qual API consultar primeiro, e a
 * confirmacao viria da resposta da propria transportadora.
 */

import type { Carrier } from '../types';

interface CarrierPattern {
  carrier: Carrier;
  pattern: RegExp;
  /** Dica de formato mostrada ao usuario. */
  hint: string;
}

export const CARRIER_PATTERNS: CarrierPattern[] = [
  { carrier: 'Correios', pattern: /^[A-Z]{2}\d{9}[A-Z]{2}$/, hint: 'Formato AA000000000BR' },
  { carrier: 'Jadlog', pattern: /^\d{14}$/, hint: '14 dígitos' },
  { carrier: 'Loggi', pattern: /^LG\d{10}$/, hint: 'Prefixo LG + 10 dígitos' },
  { carrier: 'Total Express', pattern: /^TE\d{12}$/, hint: 'Prefixo TE + 12 dígitos' },
];

/** Normaliza o que o usuario digitou: sem espacos nas pontas, tudo em maiusculas. */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase();
}

/** Devolve a transportadora identificada, ou null quando nenhum formato casa. */
export function detectCarrier(input: string): Carrier | null {
  const code = normalizeCode(input);
  return CARRIER_PATTERNS.find((c) => c.pattern.test(code))?.carrier ?? null;
}

export type DetectionStatus = 'idle' | 'detected' | 'unknown';

export interface DetectionResult {
  status: DetectionStatus;
  carrier: Carrier | null;
  /** Texto exibido abaixo do campo, conforme os tres estados do design. */
  message: string;
}

/**
 * Estado da linha de retorno sob o campo de codigo. O design define exatamente tres
 * situacoes: aguardando, identificada e nao reconhecida.
 */
export function describeDetection(input: string): DetectionResult {
  if (!input.trim()) {
    return { status: 'idle', carrier: null, message: 'Aguardando código…' };
  }

  const carrier = detectCarrier(input);

  if (carrier) {
    return {
      status: 'detected',
      carrier,
      message: `Transportadora identificada: ${carrier}`,
    };
  }

  return {
    status: 'unknown',
    carrier: null,
    message: 'Formato não reconhecido pelas transportadoras integradas',
  };
}

/** Lista de formatos aceitos, para exibir como ajuda no formulario. */
export function supportedFormats(): string[] {
  return CARRIER_PATTERNS.map((c) => `${c.carrier}: ${c.hint}`);
}

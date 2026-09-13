/**
 * Formatacao de datas e rotulos, em portugues do Brasil.
 *
 * O design mostra tempos relativos ("ha 52h") e datas curtas ("11 set · 06:14"). Como os
 * dados simulados sao gerados a partir do momento atual, esses rotulos precisam ser
 * calculados, nunca escritos a mao — caso contrario a demonstracao envelhece sozinha.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

/** Horas decorridas entre dois instantes ISO. Positivo quando `to` e posterior a `from`. */
export function hoursBetween(from: string, to: string = nowIso()): number {
  return (new Date(to).getTime() - new Date(from).getTime()) / HOUR;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Tempo decorrido em linguagem natural: "agora", "ha 40min", "ha 52h", "ha 4 dias".
 *
 * Ate 72 horas a contagem fica em horas, e nao em dias. Num painel de logistica a diferenca
 * entre 40h e 52h parado importa, e "ha 2 dias" esconde isso.
 */
export function relativeFromNow(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();

  if (elapsed < MINUTE) return 'agora';
  if (elapsed < HOUR) return `há ${Math.floor(elapsed / MINUTE)}min`;
  if (elapsed < 72 * HOUR) return `há ${Math.floor(elapsed / HOUR)}h`;

  const days = Math.floor(elapsed / DAY);
  return `há ${days} dias`;
}

/** Data curta de evento, no formato do design: "11 set · 06:14". */
export function eventDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${MONTHS[d.getMonth()]} · ${hours}:${minutes}`;
}

/** Relogio curto para o rodape da barra lateral: "09:41". */
export function clockTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export interface DueLabel {
  text: string;
  /** Verdadeiro quando o prazo vence hoje, amanha, ou ja venceu. O design pinta de vermelho. */
  urgent: boolean;
}

/**
 * Rotulo de prazo. Encomendas entregues nao mostram contagem regressiva, mostram se
 * chegaram dentro do combinado.
 */
export function dueLabel(dueAt: string, delivered = false, deliveredAt?: string): DueLabel {
  if (delivered) {
    const onTime = deliveredAt ? new Date(deliveredAt) <= new Date(dueAt) : true;
    return { text: onTime ? 'No prazo' : 'Entregue com atraso', urgent: !onTime };
  }

  const days = calendarDaysUntil(dueAt);

  if (days < 0) return { text: `Venceu há ${Math.abs(days)} dia${plural(Math.abs(days))}`, urgent: true };
  if (days === 0) return { text: 'Vence hoje', urgent: true };
  if (days === 1) return { text: 'Vence em 1 dia', urgent: true };
  return { text: `Vence em ${days} dias`, urgent: false };
}

/**
 * Diferenca em dias de calendario, nao em blocos de 24 horas. Um prazo que termina as 23h de
 * hoje "vence hoje", mesmo faltando apenas uma hora.
 */
export function calendarDaysUntil(iso: string): number {
  const target = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  return Math.round((target.getTime() - today.getTime()) / DAY);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function plural(n: number): string {
  return n === 1 ? '' : 's';
}

/** Iniciais para o avatar da barra lateral: "Marina Alves" vira "MA". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Numero com separador de milhar brasileiro. */
export function formatCount(n: number): string {
  return n.toLocaleString('pt-BR');
}

/**
 * RF04 — deteccao de anomalias e atrasos preditivos.
 *
 * Este e o nucleo da proposta do UNIRASTRO. O produto nao se diferencia por mostrar onde o
 * pacote esta, isso o site da transportadora ja faz. Ele se diferencia por perceber que algo
 * saiu do previsto *antes* do prazo estourar, para que a empresa avise o cliente final em vez
 * de ser cobrada por ele.
 *
 * Cada regra recebe a encomenda inteira e devolve uma anomalia ou nada. Nenhuma delas le
 * estado de tela, o que as torna testaveis isoladamente e faceis de mover para o backend
 * depois, que e onde de fato vao rodar.
 */

import type { Anomaly, Order } from '../types';
import { calendarDaysUntil, hoursBetween } from './format';

/* ------------------------------------------------------------------ *
 * Limites
 * ------------------------------------------------------------------ */

/**
 * Acima disso, um pacote parado na mesma unidade deixa de ser transito normal e vira
 * incidente. O valor espelha o gatilho "> 36h na mesma unidade" configurado na tela de
 * alertas: o que o operador parametriza e o que a regra aplica precisam ser o mesmo numero.
 */
export const STALL_THRESHOLD_HOURS = 36;

/** Tempo medio de permanencia numa unidade de tratamento, usado so para dar escala ao texto. */
const AVERAGE_HUB_DWELL_HOURS = 16;

/** A partir da segunda tentativa frustrada, insistir sem falar com o cliente tende a falhar. */
const FAILED_ATTEMPTS_THRESHOLD = 2;

/** Dentro dessa janela, um pacote que ainda nao saiu para entrega dificilmente chega no prazo. */
const PREDICTIVE_DELAY_DAYS = 1;

/* ------------------------------------------------------------------ *
 * Regras
 * ------------------------------------------------------------------ */

type Rule = (order: Order) => Anomaly | null;

/**
 * Parada prolongada.
 *
 * Mede ha quanto tempo o ultimo evento foi registrado. Se o pacote nao se move ha mais que o
 * limite e ainda nao foi entregue, algo travou: extravio interno, falta de veiculo na rota,
 * ou carga retida.
 */
const stalledInTransit: Rule = (order) => {
  if (order.status === 'Entregue') return null;

  const last = order.timeline[0];
  if (!last) return null;

  const stalledHours = Math.floor(hoursBetween(last.at));
  if (stalledHours <= STALL_THRESHOLD_HOURS) return null;

  const ratio = (stalledHours / AVERAGE_HUB_DWELL_HOURS).toFixed(1).replace('.', ',');
  const daysLeft = calendarDaysUntil(order.dueAt);
  const deadline =
    daysLeft <= 1
      ? ` Prazo final ${daysLeft === 0 ? 'hoje' : 'em 1 dia'} — risco concreto de atraso.`
      : '';

  return {
    rule: 'Parada prolongada',
    severity: daysLeft <= 1 ? 'Crítico' : 'Atenção',
    title: `Pacote parado ${stalledHours}h em ${last.place}`,
    description:
      `Tempo na unidade ${ratio}× acima da média histórica.` +
      deadline +
      ' Recomendado acionar a transportadora antes de comunicar nova estimativa.',
  };
};

/**
 * Tentativas de entrega frustradas.
 *
 * Uma tentativa perdida acontece. Duas indicam que o endereco ou o horario estao errados, e
 * uma terceira tentativa cega tende a falhar igual. O valor aqui e sugerir contato antes.
 */
const repeatedFailedAttempts: Rule = (order) => {
  const attempts = order.timeline.filter(isFailedAttempt);
  if (attempts.length < FAILED_ATTEMPTS_THRESHOLD) return null;

  const place = attempts[0].place;

  return {
    rule: 'Tentativa frustrada',
    severity: 'Crítico',
    title: `${ordinal(attempts.length)} tentativa frustrada em ${place}`,
    description:
      `Foram ${attempts.length} tentativas sem sucesso no mesmo endereço. ` +
      'Sugerido contato com o destinatário para confirmar endereço e janela de entrega ' +
      'antes da próxima tentativa.',
  };
};

function isFailedAttempt(event: { title: string }): boolean {
  const t = event.title.toLowerCase();
  return t.includes('tentativa') && (t.includes('não efetuada') || t.includes('frustrada'));
}

/**
 * Desvio de rota.
 *
 * Compara cada parada registrada com o plano de rota informado pela transportadora. Uma
 * parada fora do plano costuma significar carga embarcada no veiculo errado, e quase sempre
 * custa dias.
 */
const routeDeviation: Rule = (order) => {
  if (order.status === 'Entregue') return null;
  if (order.plannedRoute.length === 0) return null;

  const planned = new Set(order.plannedRoute);
  const offRoute = order.timeline.filter((e) => !planned.has(e.place));
  if (offRoute.length === 0) return null;

  const worst = offRoute[0];
  const daysLeft = calendarDaysUntil(order.dueAt);

  return {
    rule: 'Rota desviada',
    severity: daysLeft <= 1 ? 'Crítico' : 'Atenção',
    title: `Desvio de rota detectado (${worst.place})`,
    description:
      `Pacote com destino ${order.city} registrado em ${worst.place}, fora do trajeto ` +
      `previsto (${order.plannedRoute.join(' → ')}).` +
      (daysLeft > 1 ? ' Prazo ainda dentro da margem.' : ' Prazo comprometido.'),
  };
};

/**
 * Risco de atraso preditivo.
 *
 * A regra mais valiosa das quatro, porque dispara enquanto ainda da tempo de agir. Se o prazo
 * termina hoje ou amanha e o pacote sequer saiu para entrega, o atraso e praticamente certo —
 * mesmo que nada ate aqui pareca errado.
 */
const predictiveDelayRisk: Rule = (order) => {
  if (order.status === 'Entregue' || order.status === 'Saiu p/ entrega') return null;

  const daysLeft = calendarDaysUntil(order.dueAt);
  if (daysLeft > PREDICTIVE_DELAY_DAYS) return null;

  const when = daysLeft < 0 ? 'venceu' : daysLeft === 0 ? 'vence hoje' : 'vence amanhã';

  const situation =
    daysLeft < 0
      ? `Prazo vencido há ${Math.abs(daysLeft)} dia${Math.abs(daysLeft) === 1 ? '' : 's'}`
      : daysLeft === 0
        ? 'Prazo termina hoje'
        : 'Prazo termina amanhã';

  return {
    rule: 'Risco de atraso preditivo',
    severity: 'Crítico',
    title: `Prazo ${when} e pacote ainda não saiu para entrega`,
    description:
      `${situation} e o status ainda é "${order.status}". ` +
      'Janela suficiente para avisar o cliente final com nova estimativa antes da reclamação.',
  };
};

/* ------------------------------------------------------------------ *
 * Execucao
 * ------------------------------------------------------------------ */

/** Ordem importa: define qual anomalia encabeca a encomenda na lista. */
const RULES: Rule[] = [
  stalledInTransit,
  repeatedFailedAttempts,
  routeDeviation,
  predictiveDelayRisk,
];

const SEVERITY_WEIGHT = { 'Crítico': 0, 'Atenção': 1, Info: 2 } as const;

/**
 * Roda todas as regras contra uma encomenda e devolve as anomalias encontradas, das mais
 * graves para as menos graves.
 */
export function detectAnomalies(order: Order): Anomaly[] {
  return RULES.map((rule) => rule(order))
    .filter((a): a is Anomaly => a !== null)
    .sort((a, b) => SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity]);
}

function ordinal(n: number): string {
  const names = ['Primeira', 'Segunda', 'Terceira', 'Quarta', 'Quinta'];
  return names[n - 1] ?? `${n}ª`;
}

/**
 * Central de incidentes e gatilhos (RF04, RF05, RF06).
 *
 * Os incidentes nao sao uma tabela. Sao derivados das encomendas a cada consulta, aplicando as
 * regras de anomalia. Essa escolha importa: uma lista gravada envelheceria em silencio, e um
 * pacote que voltasse a se mover continuaria aparecendo como parado. Derivando, a central
 * reflete sempre o estado real da operacao.
 *
 * O que persiste e apenas a decisao humana: quais incidentes o operador marcou como
 * resolvidos.
 */

import { detectAnomalies } from '../lib/anomalyRules';
import { RULE_TO_TRIGGER } from '../mocks/triggers';
import type { ApiResponse, Incident, NotificationTrigger, Severity, TenantId } from '../types';
import { clone, fail, ok } from './client';
import { store } from './store';

const SEVERITY_WEIGHT: Record<Severity, number> = { 'Crítico': 0, 'Atenção': 1, Info: 2 };

/**
 * Um incidente derivado precisa de identidade estavel entre consultas, senao "resolver" nao
 * gruda: a lista seria recalculada e o item voltaria como novo.
 */
function incidentId(code: string, rule: string): string {
  return `${code}::${rule}`;
}

/**
 * O cliente final foi avisado?
 *
 * A resposta depende do gatilho correspondente estar ligado. E assim que RF05 e RF06 se
 * encaixam: a parametrizacao do operador decide o que vira aviso automatico, e a central
 * mostra o resultado dessa decisao.
 */
function wasNotified(rule: string, triggers: NotificationTrigger[]): boolean {
  const triggerId = RULE_TO_TRIGGER[rule as keyof typeof RULE_TO_TRIGGER];
  if (!triggerId) return false;
  return triggers.find((t) => t.id === triggerId)?.enabled ?? false;
}

export async function listIncidents(tenantId: TenantId): Promise<ApiResponse<Incident[]>> {
  const derived: Incident[] = store.orders
    .filter((o) => o.tenantId === tenantId)
    .flatMap((order) =>
      detectAnomalies(order).map((anomaly) => {
        const id = incidentId(order.code, anomaly.rule);
        return {
          ...anomaly,
          id,
          tenantId,
          code: order.code,
          carrier: order.carrier,
          // O incidente e tao recente quanto o evento que o revelou.
          detectedAt: order.timeline[0]?.at ?? new Date().toISOString(),
          notified: wasNotified(anomaly.rule, store.triggers),
          resolved: store.resolvedIncidentIds.has(id),
        };
      }),
    );

  const system = store.systemIncidents
    .filter((i) => i.tenantId === tenantId)
    .map((i) => ({ ...i, resolved: store.resolvedIncidentIds.has(i.id) }));

  const all = [...derived, ...system].sort(compareIncidents);

  return ok(clone(all));
}

/** Abertos antes de resolvidos, mais graves antes de menos graves, recentes antes de antigos. */
function compareIncidents(a: Incident, b: Incident): number {
  if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;

  const bySeverity = SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity];
  if (bySeverity !== 0) return bySeverity;

  return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
}

export async function resolveIncident(id: string): Promise<ApiResponse<null>> {
  store.resolvedIncidentIds.add(id);
  return ok(null, 'Incidente marcado como resolvido');
}

export async function reopenIncident(id: string): Promise<ApiResponse<null>> {
  store.resolvedIncidentIds.delete(id);
  return ok(null, 'Incidente reaberto');
}

/* ------------------------------------------------------------------ *
 * Gatilhos de notificacao (RF05)
 * ------------------------------------------------------------------ */

export async function listTriggers(): Promise<ApiResponse<NotificationTrigger[]>> {
  return ok(clone(store.triggers));
}

export async function toggleTrigger(
  id: string,
): Promise<ApiResponse<NotificationTrigger[] | null>> {
  const trigger = store.triggers.find((t) => t.id === id);

  if (!trigger) {
    return fail('Gatilho não encontrado.', [`Nenhum gatilho com o identificador ${id}.`]);
  }

  trigger.enabled = !trigger.enabled;

  return ok(
    clone(store.triggers),
    `Gatilho "${trigger.label}" ${trigger.enabled ? 'ativado' : 'desativado'}`,
  );
}

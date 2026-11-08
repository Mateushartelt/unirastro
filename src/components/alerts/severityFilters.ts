import type { Incident } from '../../types';

export const SEVERITY_FILTERS = ['Todos', 'Crítico', 'Atenção', 'Info'] as const;

export type SeverityFilter = (typeof SEVERITY_FILTERS)[number];

export function filterBySeverity(incidents: Incident[], filter: SeverityFilter): Incident[] {
  if (filter === 'Todos') return incidents;
  return incidents.filter((i) => i.severity === filter);
}

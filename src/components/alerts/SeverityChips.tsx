import type { Incident } from '../../types';
import { Chip } from '../ui/Chip';
import { filterBySeverity, SEVERITY_FILTERS, type SeverityFilter } from './severityFilters';

interface SeverityChipsProps {
  incidents: Incident[];
  active: SeverityFilter;
  onChange: (filter: SeverityFilter) => void;
  className?: string;
}

/** Um chip por severidade, cada um com a contagem de incidentes daquela severidade. */
export function SeverityChips({ incidents, active, onChange, className }: Readonly<SeverityChipsProps>) {
  return (
    <div className={className}>
      {SEVERITY_FILTERS.map((f) => (
        <Chip
          key={f}
          label={f}
          active={active === f}
          onClick={() => onChange(f)}
          count={filterBySeverity(incidents, f).length}
        />
      ))}
    </div>
  );
}

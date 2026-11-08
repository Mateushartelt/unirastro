import type { Incident } from '../../types';
import { EmptyState } from '../ui/Feedback';
import { IncidentCard } from './IncidentCard';

interface IncidentListProps {
  /** Incidentes que passaram pelo filtro de severidade. */
  incidents: Incident[];
  /** Total antes do filtro: decide qual mensagem de lista vazia mostrar. */
  totalCount: number;
  canResolve: boolean;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
  className?: string;
}

export function IncidentList({
  incidents,
  totalCount,
  className,
  ...actions
}: Readonly<IncidentListProps>) {
  if (incidents.length === 0) {
    const message =
      totalCount === 0
        ? 'Nenhum incidente detectado. Todas as encomendas seguem dentro do previsto.'
        : 'Nenhum incidente com essa severidade.';
    return <EmptyState message={message} />;
  }

  return (
    <div className={className}>
      {incidents.map((incident) => (
        <IncidentCard key={incident.id} incident={incident} {...actions} />
      ))}
    </div>
  );
}

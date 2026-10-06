/** Gatilhos de notificacao em memoria (fatia `triggers` do antigo store global). */

import type { ITriggerRepository } from '../../services/simulated/ports';
import type { NotificationTrigger } from '../../types';

export class InMemoryTriggerRepository implements ITriggerRepository {
  private triggers: NotificationTrigger[];

  constructor(seed: readonly NotificationTrigger[]) {
    this.triggers = structuredClone([...seed]);
  }

  list(): NotificationTrigger[] {
    return this.triggers;
  }

  findById(id: string): NotificationTrigger | null {
    return this.triggers.find((t) => t.id === id) ?? null;
  }

  update(trigger: NotificationTrigger): void {
    this.triggers = this.triggers.map((t) => (t.id === trigger.id ? trigger : t));
  }
}

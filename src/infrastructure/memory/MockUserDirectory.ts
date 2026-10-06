/**
 * Contas e empresas simuladas (RF10).
 *
 * Implementa duas portas: IUserDirectory, que o servico de autenticacao usa, e IDemoAccounts,
 * que a tela de login usa para listar as contas de teste. Antes a LoginPage importava
 * mocks/users.ts direto, furando a regra do proprio projeto de que paginas so falam com
 * services/.
 */

import type { DemoAccount, IDemoAccounts } from '../../services/contracts';
import type { IUserDirectory } from '../../services/simulated/ports';
import type { Tenant, TenantId, User } from '../../types';

export class MockUserDirectory implements IUserDirectory, IDemoAccounts {
  private readonly users: readonly User[];
  private readonly tenants: readonly Tenant[];

  constructor(users: readonly User[], tenants: readonly Tenant[]) {
    this.users = users;
    this.tenants = tenants;
  }

  findByEmail(email: string): User | null {
    const normalized = email.trim().toLowerCase();
    return this.users.find((u) => u.email.toLowerCase() === normalized) ?? null;
  }

  exists(userId: string, tenantId: TenantId): boolean {
    return this.users.some((u) => u.id === userId && u.tenantId === tenantId);
  }

  findTenant(tenantId: TenantId): Tenant | null {
    return this.tenants.find((t) => t.id === tenantId) ?? null;
  }

  list(): DemoAccount[] {
    return this.users.map((u) => ({
      email: u.email,
      password: u.password,
      role: u.role,
      tenant: this.findTenant(u.tenantId)?.name ?? 'Empresa',
    }));
  }
}

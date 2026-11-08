import type { ReactNode } from 'react';
import type { AppServices } from './container';
import { ServicesContext } from './servicesContext';

export function ServicesProvider({
  services,
  children,
}: Readonly<{
  services: AppServices;
  children: ReactNode;
}>) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

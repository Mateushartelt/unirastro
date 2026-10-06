/**
 * Entrega dos servicos montados no composition root para a arvore do React.
 *
 * Telas e contextos chamam `useServices()` e recebem interfaces. Nao sabem se do outro lado ha
 * mock, HTTP ou um dublê de teste.
 */

import { createContext, useContext } from 'react';
import type { AppServices } from './container';

export const ServicesContext = createContext<AppServices | null>(null);

export function useServices(): AppServices {
  const services = useContext(ServicesContext);

  if (!services) {
    throw new Error('useServices precisa estar dentro de <ServicesProvider>.');
  }

  return services;
}

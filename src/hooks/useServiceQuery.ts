/**
 * Carrega dados de um servico e recarrega quando o DataContext sinaliza uma mudanca.
 *
 * O mesmo bloco de useEffect (flag `active`, checagem de `success`, estado de erro e de
 * carregamento) estava copiado em OrdersPage, AlertsPage e AppShell. Agora mora aqui, e as
 * telas ficam so com o que e delas: decidir o que mostrar.
 *
 * Nao volta para "carregando" nas recargas. Na primeira vez o estado ja nasce verdadeiro; nas
 * seguintes, disparadas por uma acao do usuario, os dados antigos continuam visiveis ate os
 * novos chegarem. Sem isso a tela piscaria "Carregando..." a cada incidente resolvido.
 */

import { useEffect, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { responseMessage } from '../services/response';
import type { ApiResponse } from '../types';

export interface ServiceQuery<T> {
  data: T;
  loading: boolean;
  error: string;
}

/**
 * @param load   chamada ao servico.
 * @param key    o que identifica a consulta (ex.: o tenant). Mudou, recarrega.
 * @param initial valor exibido antes da primeira resposta.
 */
export function useServiceQuery<T>(
  load: () => Promise<ApiResponse<T>>,
  key: string,
  initial: T,
): ServiceQuery<T> {
  const { version } = useData();
  const [state, setState] = useState<ServiceQuery<T>>({ data: initial, loading: true, error: '' });

  // As telas passam uma funcao `load` nova a cada render. Guardada numa ref, a versao mais
  // recente fica disponivel sem que cada render dispare uma recarga: o que define a consulta
  // e `key` (e o sinal `version` do DataContext).
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let active = true;

    loadRef.current().then((response) => {
      // A tela pode ter sido desmontada durante a espera. Gravar estado depois disso
      // sobrescreveria dados mais novos.
      if (!active) return;

      setState((previous) =>
        response.success
          ? { data: response.data, loading: false, error: '' }
          : { data: previous.data, loading: false, error: responseMessage(response) },
      );
    });

    return () => {
      active = false;
    };
  }, [key, version]);

  return state;
}

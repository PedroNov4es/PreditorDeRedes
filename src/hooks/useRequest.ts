import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { ApiError, toApiError } from '../services/errors';

interface RequestState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

/**
 * Executa uma requisição quando as dependências mudam e expõe `reload`
 * (usado pelo botão "Tentar novamente", RNF11). Ignora respostas obsoletas.
 */
export function useRequest<T>(run: () => Promise<T>, deps: DependencyList, enabled = true) {
  const [state, setState] = useState<RequestState<T>>({ data: null, error: null, loading: enabled });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    let cancelled = false;
    setState({ data: null, error: null, loading: true });
    run()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, error: toApiError(error), loading: false });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt, enabled]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}

import { useEffect, useState } from "react";
import type { DependencyList } from "react";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(factory: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    setLoading(true);
    setError(null);

    void factory()
      .then((result) => {
        if (!canceled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!canceled) {
          setError(err instanceof Error ? err.message : "请求失败");
        }
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

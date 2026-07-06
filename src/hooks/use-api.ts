import { useState, useEffect, useCallback } from "react";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
};

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  const body: ApiEnvelope<T> = await res.json();
  if (body.success && body.data !== undefined) return body.data;
  if (!body.success && body.error) throw new Error(body.error);
  return body as unknown as T;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return path;
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) searchParams.set(key, String(value));
  }
  const qs = searchParams.toString();
  return qs ? `${path}?${qs}` : path;
}

function toRequestInit(opts?: FetchOptions): RequestInit {
  if (!opts) return {};
  const { body, headers, ...rest } = opts;
  return {
    ...rest,
    headers: { "Content-Type": "application/json", ...(headers as Record<string, string>) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  } as RequestInit;
}

export async function apiGet<T = unknown>(
  path: string,
  options?: FetchOptions
): Promise<T> {
  const url = buildUrl(path, options?.params as Record<string, string | number | boolean | undefined> | undefined);
  const res = await fetch(url, { ...options, method: "GET" } as RequestInit);
  return handleResponse<T>(res);
}

export async function apiPost<T = unknown>(
  path: string,
  options?: FetchOptions
): Promise<T> {
  const res = await fetch(path, { ...toRequestInit(options), method: "POST" });
  return handleResponse<T>(res);
}

export async function apiPut<T = unknown>(
  path: string,
  options?: FetchOptions
): Promise<T> {
  const res = await fetch(path, { ...toRequestInit(options), method: "PUT" });
  return handleResponse<T>(res);
}

export async function apiPatch<T = unknown>(
  path: string,
  options?: FetchOptions
): Promise<T> {
  const res = await fetch(path, { ...toRequestInit(options), method: "PATCH" });
  return handleResponse<T>(res);
}

export async function apiDelete<T = unknown>(
  path: string,
  options?: FetchOptions
): Promise<T> {
  const res = await fetch(path, { ...options, method: "DELETE" } as RequestInit);
  return handleResponse<T>(res);
}

// --- React hooks ---

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface QueryResult<T> extends QueryState<T> {
  refresh: () => void;
}

export function useQuery<T = unknown>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): QueryResult<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: prev.data === null, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({ data: prev.data, loading: false, error: (err as Error).message }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refresh: execute };
}

export function useApiGet<T = unknown>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>,
  deps: unknown[] = []
): QueryResult<T> {
  return useQuery(() => apiGet<T>(url, { params }), [url, ...deps]);
}

interface MutationState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

interface MutationResult<T> extends MutationState<T> {
  mutate: (body?: unknown, options?: FetchOptions) => Promise<T | null>;
  reset: () => void;
}

function useMutation<T = unknown>(
  mutator: (body?: unknown, options?: FetchOptions) => Promise<T>
): MutationResult<T> {
  const [state, setState] = useState<MutationState<T>>({
    loading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(
    async (body?: unknown, options?: FetchOptions) => {
      setState({ loading: true, error: null, data: null });
      try {
        const data = await mutator(body, options);
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const message = (err as Error).message;
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    [mutator]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return { ...state, mutate, reset };
}

export function useApiPost<T = unknown>(url: string): MutationResult<T> {
  return useMutation((body) => apiPost<T>(url, { body }));
}

export function useApiPut<T = unknown>(url: string): MutationResult<T> {
  return useMutation((body) => apiPut<T>(url, { body }));
}

export function useApiDelete<T = unknown>(url: string): MutationResult<T> {
  return useMutation(() => apiDelete<T>(url));
}

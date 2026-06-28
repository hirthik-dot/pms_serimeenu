import type { ApiResponse } from '@/types/api';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors: Array<{ field: string; message: string }> = [],
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const API_BASE = '/api/v1';

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new ApiClientError(
      data.message ?? 'Request failed',
      response.status,
      data.errors ?? [],
    );
  }

  return data;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  return parseResponse<T>(response);
}

export async function apiFetchWithRefresh<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiClientError && error.statusCode === 401) {
      await apiFetch<null>('/auth/refresh', { method: 'POST' });
      return apiFetch<T>(path, options);
    }
    throw error;
  }
}

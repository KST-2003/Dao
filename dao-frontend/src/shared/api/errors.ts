import { AxiosError } from 'axios';

/** Every API failure is normalized to this shape: { status, code, message, errors }. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly errors: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }

  /** First validation message for a field (Laravel shape: { field: [msg] }). */
  fieldError(field: string): string | undefined {
    const value = this.errors[field];
    return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : undefined;
  }
}

interface ErrorBody {
  message?: string;
  code?: string;
  errors?: Record<string, unknown>;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof AxiosError) {
    if (!error.response) {
      return new ApiError(0, 'NETWORK_ERROR', error.message);
    }
    const body = (error.response.data ?? {}) as ErrorBody;
    return new ApiError(error.response.status, body.code ?? 'HTTP_ERROR', body.message ?? error.message, body.errors ?? {});
  }
  return new ApiError(-1, 'UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
}

export function isApiError(e: unknown, code?: string): e is ApiError {
  return e instanceof ApiError && (code === undefined || e.code === code);
}

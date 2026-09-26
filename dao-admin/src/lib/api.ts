import axios, { AxiosError } from 'axios'
import type { ApiErrorBody } from '@/types/api'

/**
 * The admin token lives in an httpOnly SameSite=Strict cookie set by the API (never readable by JS).
 * X-Requested-With is required by the backend for cookie-authenticated writes (CSRF defence).
 */
export const http = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/admin/v1`,
  withCredentials: true,
  headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  timeout: 30000,
})

export class ApiError extends Error {
  status: number
  code: string
  errors: Record<string, unknown>
  constructor(status: number, code: string, message: string, errors: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.errors = errors
  }
  field(name: string): string | undefined {
    const v = this.errors[name]
    return Array.isArray(v) && typeof v[0] === 'string' ? v[0] : undefined
  }
}

let onUnauthorized: (() => void) | null = null
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn }

http.interceptors.response.use(
  (r) => r,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? 0
    const body = error.response?.data
    if (status === 401) onUnauthorized?.()
    return Promise.reject(new ApiError(status, body?.code ?? (status ? 'HTTP_ERROR' : 'NETWORK_ERROR'), body?.message ?? error.message, (body?.errors ?? {}) as Record<string, unknown>))
  },
)

export const api = {
  get: async <T>(url: string, params?: Record<string, unknown>) => (await http.get<{ data: T }>(url, { params })).data.data,
  page: async <T>(url: string, params?: Record<string, unknown>) => (await http.get<T>(url, { params })).data,
  post: async <T>(url: string, body?: unknown) => (await http.post<{ data: T }>(url, body)).data.data,
  put: async <T>(url: string, body?: unknown) => (await http.put<{ data: T }>(url, body)).data.data,
  del: async <T>(url: string) => (await http.delete<{ data: T }>(url)).data.data,
  upload: async <T>(url: string, form: FormData) => (await http.post<{ data: T }>(url, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data,
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.status === 0 ? 'Cannot reach the DAO API. Check your connection.' : e.message
  return 'Something went wrong.'
}

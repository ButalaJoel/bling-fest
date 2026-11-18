// One fetch wrapper for the whole site. Same origin as the API, so the httpOnly session
// cookie travels automatically; the custom header is what the server's CSRF guard checks.

export class ApiError extends Error {
  status: number
  field?: string
  constructor(message: string, status: number, field?: string) {
    super(message)
    this.status = status
    this.field = field
  }
}

type Options = { method?: string; body?: unknown; form?: FormData; signal?: AbortSignal }

export async function api<T = unknown>(path: string, { method = 'GET', body, form, signal }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Requested-With': 'blingfest', Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal,
    })
  } catch {
    throw new ApiError('No connection. Please check your internet and try again.', 0)
  }
  let json: { success?: boolean; message?: string; field?: string; data?: T } = {}
  try { json = await res.json() } catch { /* empty or non-JSON body */ }
  if (!res.ok || json.success === false) {
    if (res.status === 401 && path !== '/auth/me' && path !== '/auth/login') window.dispatchEvent(new Event('bf:signed-out'))
    throw new ApiError(json.message ?? 'Something went wrong. Please try again.', res.status, json.field)
  }
  return (json.data ?? json) as T
}

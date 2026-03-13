import type { H3Event } from 'h3'

export interface AuthContext {
  userId: string
  username: string
  tenantId: string
  isAdmin: boolean
}

export function setAuthContext(event: H3Event, auth: AuthContext) {
  event.context.auth = auth
}

export function getAuthContext(event: H3Event) {
  return event.context.auth as AuthContext | undefined
}

export function requireAuthContext(event: H3Event) {
  const auth = getAuthContext(event)
  if (!auth) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized',
    })
  }
  return auth
}

export function requireAdminContext(event: H3Event) {
  const auth = requireAuthContext(event)
  if (!auth.isAdmin) {
    throw createError({
      status: 403,
      statusText: 'Forbidden',
    })
  }
  return auth
}

export function getTenantId(event: H3Event) {
  return requireAuthContext(event).tenantId
}

export async function resolveTenantIdByDomain(event: H3Event, domain: string) {
  const { cloudflare } = event.context
  if (!cloudflare?.env?.KV)
    return null
  return await cloudflare.env.KV.get(`domain:${domain}`)
}

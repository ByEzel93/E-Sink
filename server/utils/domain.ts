import type { H3Event } from 'h3'

const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

function getStore(event: H3Event) {
  const { cloudflare } = event.context
  if (!cloudflare?.env?.KV) {
    throw createError({ status: 500, statusText: 'KV binding is not configured' })
  }
  return cloudflare.env.KV
}

export function normalizeDomain(domain: string) {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

export function validateDomain(domain: string) {
  const normalized = normalizeDomain(domain)
  if (!DOMAIN_REGEX.test(normalized)) {
    throw createError({
      status: 400,
      statusText: 'Invalid domain',
    })
  }
  return normalized
}

function getDomainKey(domain: string) {
  return `domain:${domain}`
}

function getTenantDomainKey(tenantId: string, domain: string) {
  return `tenant-domain:${tenantId}:${domain}`
}

export async function listTenantDomains(event: H3Event, tenantId: string) {
  const KV = getStore(event)
  const prefix = `tenant-domain:${tenantId}:`
  const result = await KV.list({ prefix, limit: 1000 })
  return result.keys.map(key => key.name.replace(prefix, ''))
}

export async function addTenantDomain(event: H3Event, tenantId: string, domain: string) {
  const KV = getStore(event)
  const owner = await KV.get(getDomainKey(domain))
  if (owner && owner !== tenantId) {
    throw createError({
      status: 409,
      statusText: 'Domain already assigned',
    })
  }
  await KV.put(getDomainKey(domain), tenantId)
  await KV.put(getTenantDomainKey(tenantId, domain), '1')
}

export async function removeTenantDomain(event: H3Event, tenantId: string, domain: string) {
  const KV = getStore(event)
  const owner = await KV.get(getDomainKey(domain))
  if (owner !== tenantId) {
    throw createError({
      status: 404,
      statusText: 'Domain not found',
    })
  }
  await KV.delete(getDomainKey(domain))
  await KV.delete(getTenantDomainKey(tenantId, domain))
}

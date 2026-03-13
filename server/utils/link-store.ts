import type { LinkSchema } from '#shared/schemas/link'
import type { H3Event } from 'h3'
import type { z } from 'zod'
import { parseURL, stringifyParsedURL } from 'ufo'
import { getAuthContext, resolveTenantIdByDomain } from './tenant'

type Link = z.infer<typeof LinkSchema>

export function withoutQuery(url: string): string {
  const parsed = parseURL(url)
  return stringifyParsedURL({ ...parsed, search: '' })
}

export function normalizeSlug(event: H3Event, slug: string): string {
  const { caseSensitive } = useRuntimeConfig(event)
  return caseSensitive ? slug : slug.toLowerCase()
}

export function buildShortLink(event: H3Event, slug: string): string {
  return `${getRequestProtocol(event)}://${getRequestHost(event)}/${slug}`
}

async function resolveTenantId(event: H3Event) {
  const auth = getAuthContext(event)
  if (auth) {
    return auth.isAdmin ? 'admin' : auth.tenantId
  }
  const host = getRequestHost(event).replace(/:\d+$/, '').toLowerCase()
  const tenantIdByDomain = await resolveTenantIdByDomain(event, host)
  return tenantIdByDomain || 'admin'
}

function getTenantLinkKey(tenantId: string, slug: string) {
  return `link:${tenantId}:${slug}`
}

export async function putLink(event: H3Event, link: Link): Promise<void> {
  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  const expiration = getExpiration(event, link.expiration)
  const tenantId = await resolveTenantId(event)

  await KV.put(getTenantLinkKey(tenantId, link.slug), JSON.stringify(link), {
    expiration,
    metadata: {
      expiration,
      url: withoutQuery(link.url),
      comment: link.comment,
      tenantId,
    },
  })
}

export async function getLink(event: H3Event, slug: string, cacheTtl?: number): Promise<Link | null> {
  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  const tenantId = await resolveTenantId(event)
  return await KV.get(getTenantLinkKey(tenantId, slug), { type: 'json', cacheTtl }) as Link | null
}

export async function getLinkWithMetadata(event: H3Event, slug: string): Promise<{ link: Link | null, metadata: Record<string, unknown> | null }> {
  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  const tenantId = await resolveTenantId(event)
  const { metadata, value: link } = await KV.getWithMetadata(getTenantLinkKey(tenantId, slug), { type: 'json' })
  return { link: link as Link | null, metadata: metadata as Record<string, unknown> | null }
}

export async function deleteLink(event: H3Event, slug: string): Promise<void> {
  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  const tenantId = await resolveTenantId(event)
  await KV.delete(getTenantLinkKey(tenantId, slug))
}

export async function linkExists(event: H3Event, slug: string): Promise<boolean> {
  const link = await getLink(event, slug)
  return link !== null
}

interface ListLinksOptions {
  limit: number
  cursor?: string
}

interface ListLinksResult {
  links: (Link | null)[]
  list_complete: boolean
  cursor?: string
}

export async function listLinks(event: H3Event, options: ListLinksOptions): Promise<ListLinksResult> {
  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  const tenantId = await resolveTenantId(event)
  const prefix = `link:${tenantId}:`
  let listCursor: string | undefined
  const keys: Array<{ name: string }> = []

  while (true) {
    const list = await KV.list({
      prefix,
      limit: 1000,
      cursor: listCursor,
    })
    keys.push(...(list.keys || []) as Array<{ name: string }>)
    if (list.list_complete)
      break
    listCursor = 'cursor' in list ? list.cursor : undefined
  }

  const hydrated = await Promise.all(
    keys.map(async (key) => {
      const { metadata, value: link } = await KV.getWithMetadata(key.name, { type: 'json' }) as { metadata: Record<string, unknown> | null, value: Link | null }
      if (!link)
        return null
      return {
        ...(metadata ?? {}),
        ...link,
      } as Link & Record<string, unknown>
    }),
  )

  const sorted = hydrated
    .filter(Boolean)
    .sort((a, b) => {
      const updatedA = (a?.updatedAt as number) || 0
      const updatedB = (b?.updatedAt as number) || 0
      if (updatedA !== updatedB)
        return updatedB - updatedA
      const createdA = (a?.createdAt as number) || 0
      const createdB = (b?.createdAt as number) || 0
      return createdB - createdA
    }) as (Link & Record<string, unknown>)[]

  const offset = Math.max(0, Number.parseInt(options.cursor || '0', 10) || 0)
  const nextOffset = offset + options.limit
  const links = sorted.slice(offset, nextOffset)
  const listComplete = nextOffset >= sorted.length

  return {
    links,
    list_complete: listComplete,
    cursor: listComplete ? '' : String(nextOffset),
  }
}

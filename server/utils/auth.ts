import type { H3Event } from 'h3'
import { z } from 'zod'

const PASSWORD_ITERATIONS = 100_000
const PASSWORD_KEY_LENGTH = 32
const PASSWORD_ALGORITHM = 'SHA-256'
const SESSION_TTL = 60 * 60 * 24 * 30

export interface UserRecord {
  id: string
  username: string
  passwordHash: string
  tenantId: string
  isAdmin?: boolean
  createdAt: string
}

export interface PublicUserRecord {
  id: string
  username: string
  tenantId: string
  isAdmin: boolean
  createdAt: string
}

export interface SessionRecord {
  token: string
  userId: string
  username: string
  tenantId: string
  isAdmin?: boolean
  createdAt: string
}

const CredentialsSchema = z.object({
  username: z.string().trim().min(3).max(32),
  password: z.string().min(8).max(128),
})

function base64UrlEncode(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

async function deriveKey(password: string, salt: Uint8Array) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: PASSWORD_ALGORITHM, salt: salt.buffer as ArrayBuffer, iterations: PASSWORD_ITERATIONS },
    key,
    PASSWORD_KEY_LENGTH * 8,
  )
  return new Uint8Array(bits)
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

export function validateCredentials(value: unknown) {
  return CredentialsSchema.parse(value)
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await deriveKey(password, salt)
  return `pbkdf2$${PASSWORD_ITERATIONS}$${base64UrlEncode(salt)}$${base64UrlEncode(hash)}`
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, saltRaw, hashRaw] = stored.split('$')
  if (!scheme || !saltRaw || !hashRaw || !iterations)
    return false
  if (scheme !== 'pbkdf2')
    return false
  const salt = base64UrlDecode(saltRaw)
  const hash = base64UrlDecode(hashRaw)
  const derived = await deriveKey(password, salt)
  if (derived.length !== hash.length)
    return false
  return derived.every((byte, index) => byte === hash[index])
}

function buildSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return base64UrlEncode(bytes)
}

function getStore(event: H3Event) {
  const { cloudflare } = event.context
  if (!cloudflare?.env?.KV) {
    throw createError({ status: 500, statusText: 'KV binding is not configured' })
  }
  return cloudflare.env.KV
}

export async function getUserByUsername(event: H3Event, username: string) {
  const KV = getStore(event)
  return await KV.get(`user:${username}`, { type: 'json' }) as UserRecord | null
}

export async function listUsers(event: H3Event) {
  const KV = getStore(event)
  let cursor: string | undefined
  const users: PublicUserRecord[] = []

  while (true) {
    const result = await KV.list({
      prefix: 'user:',
      limit: 1000,
      cursor,
    })
    cursor = 'cursor' in result ? result.cursor : undefined

    for (const key of result.keys || []) {
      const user = await KV.get(key.name, { type: 'json' }) as UserRecord | null
      if (!user)
        continue
      users.push({
        id: user.id,
        username: user.username,
        tenantId: user.tenantId,
        isAdmin: user.isAdmin === true,
        createdAt: user.createdAt,
      })
    }

    if (result.list_complete)
      break
  }

  return users.sort((a, b) => a.username.localeCompare(b.username))
}

export async function createUser(event: H3Event, username: string, password: string) {
  const KV = getStore(event)
  const user: UserRecord = {
    id: crypto.randomUUID(),
    username,
    passwordHash: await hashPassword(password),
    tenantId: crypto.randomUUID(),
    isAdmin: false,
    createdAt: new Date().toISOString(),
  }
  await KV.put(`user:${username}`, JSON.stringify(user))
  return user
}

export async function createSession(event: H3Event, user: UserRecord) {
  const KV = getStore(event)
  const session: SessionRecord = {
    token: buildSessionToken(),
    userId: user.id,
    username: user.username,
    tenantId: user.tenantId,
    isAdmin: user.isAdmin === true,
    createdAt: new Date().toISOString(),
  }
  await KV.put(`session:${session.token}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL,
  })
  return session
}

export async function getAuthSession(event: H3Event, token: string) {
  const KV = getStore(event)
  return await KV.get(`session:${token}`, { type: 'json' }) as SessionRecord | null
}

export async function setUserAdmin(event: H3Event, username: string, isAdmin: boolean) {
  const KV = getStore(event)
  const user = await getUserByUsername(event, username)
  if (!user) {
    throw createError({
      status: 404,
      statusText: 'User not found',
    })
  }
  user.isAdmin = isAdmin
  await KV.put(`user:${username}`, JSON.stringify(user))
  return user
}

export async function deleteSession(event: H3Event, token: string) {
  const KV = getStore(event)
  await KV.delete(`session:${token}`)
}

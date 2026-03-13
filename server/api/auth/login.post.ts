import { createSession, getUserByUsername, normalizeUsername, validateCredentials, verifyPassword } from '../../utils/auth'

export default eventHandler(async (event) => {
  const body = await readBody(event)
  const credentials = validateCredentials(body)
  const username = normalizeUsername(credentials.username)

  const user = await getUserByUsername(event, username)
  if (!user) {
    throw createError({
      status: 401,
      statusText: 'Invalid credentials',
    })
  }

  const matched = await verifyPassword(credentials.password, user.passwordHash)
  if (!matched) {
    throw createError({
      status: 401,
      statusText: 'Invalid credentials',
    })
  }

  const session = await createSession(event, user)
  return {
    token: session.token,
    user: {
      id: user.id,
      username: user.username,
      tenantId: user.tenantId,
    },
  }
})

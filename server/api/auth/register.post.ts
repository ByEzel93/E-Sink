import { createSession, createUser, getUserByUsername, normalizeUsername, validateCredentials } from '../../utils/auth'

export default eventHandler(async (event) => {
  const body = await readBody(event)
  const credentials = validateCredentials(body)
  const username = normalizeUsername(credentials.username)

  const existing = await getUserByUsername(event, username)
  if (existing) {
    throw createError({
      status: 409,
      statusText: 'Username already exists',
    })
  }

  const user = await createUser(event, username, credentials.password)
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

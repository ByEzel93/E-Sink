import { getAuthSession } from '../utils/auth'
import { setAuthContext } from '../utils/tenant'

export default eventHandler(async (event) => {
  if (!event.path.startsWith('/api/'))
    return

  const openPaths = ['/api/auth/login', '/api/auth/register']
  if (openPaths.includes(event.path))
    return

  const token = getHeader(event, 'Authorization')?.replace(/^Bearer\s+/, '')
  if (!token) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized',
    })
  }

  const { siteToken } = useRuntimeConfig(event)
  if (token === siteToken) {
    setAuthContext(event, {
      userId: 'admin',
      username: 'admin',
      tenantId: 'admin',
      isAdmin: true,
    })
    return
  }

  const session = await getAuthSession(event, token)
  if (!session) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized',
    })
  }

  setAuthContext(event, {
    userId: session.userId,
    username: session.username,
    tenantId: session.tenantId,
    isAdmin: false,
  })
})

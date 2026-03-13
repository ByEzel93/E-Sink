import { deleteSession } from '../../utils/auth'

export default eventHandler(async (event) => {
  const token = getHeader(event, 'Authorization')?.replace(/^Bearer\s+/, '')
  if (!token) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized',
    })
  }

  const { siteToken } = useRuntimeConfig(event)
  if (token !== siteToken) {
    await deleteSession(event, token)
  }

  return { success: true }
})

import { requireAuthContext } from '../../utils/tenant'

export default eventHandler((event) => {
  const auth = requireAuthContext(event)
  return {
    userId: auth.userId,
    username: auth.username,
    tenantId: auth.tenantId,
    isAdmin: auth.isAdmin,
  }
})

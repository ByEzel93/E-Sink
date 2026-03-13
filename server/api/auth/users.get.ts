import { listUsers } from '../../utils/auth'
import { requireAdminContext } from '../../utils/tenant'

export default eventHandler(async (event) => {
  requireAdminContext(event)
  const users = await listUsers(event)
  return {
    users: [
      {
        id: 'admin',
        username: 'admin',
        tenantId: 'admin',
        isAdmin: true,
        createdAt: '',
      },
      ...users,
    ],
  }
})

import { z } from 'zod'
import { normalizeUsername, setUserAdmin } from '../../utils/auth'
import { requireAdminContext } from '../../utils/tenant'

const PromoteSchema = z.object({
  username: z.string().trim().min(3).max(32),
  isAdmin: z.boolean().default(true),
})

export default eventHandler(async (event) => {
  requireAdminContext(event)
  const body = await readValidatedBody(event, PromoteSchema.parse)
  const username = normalizeUsername(body.username)
  const user = await setUserAdmin(event, username, body.isAdmin)
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      tenantId: user.tenantId,
      isAdmin: user.isAdmin === true,
    },
  }
})

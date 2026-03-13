import { z } from 'zod'
import { removeTenantDomain, validateDomain } from '../../utils/domain'
import { requireAdminContext } from '../../utils/tenant'

const DeleteDomainSchema = z.object({
  domain: z.string().trim().min(1),
})

export default eventHandler(async (event) => {
  const { domain } = await readValidatedBody(event, DeleteDomainSchema.parse)
  const normalizedDomain = validateDomain(domain)
  const { tenantId } = requireAdminContext(event)
  await removeTenantDomain(event, tenantId, normalizedDomain)
  return { success: true }
})

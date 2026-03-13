import { z } from 'zod'
import { removeTenantDomain, validateDomain } from '../../utils/domain'
import { getTenantId, requireAdminContext } from '../../utils/tenant'

const DeleteDomainSchema = z.object({
  domain: z.string().trim().min(1),
  tenantId: z.string().trim().min(1).max(128).optional(),
})

export default eventHandler(async (event) => {
  const { domain, tenantId } = await readValidatedBody(event, DeleteDomainSchema.parse)
  const normalizedDomain = validateDomain(domain)
  requireAdminContext(event)
  const targetTenantId = tenantId || getTenantId(event)
  await removeTenantDomain(event, targetTenantId, normalizedDomain)
  return { success: true, tenantId: targetTenantId }
})

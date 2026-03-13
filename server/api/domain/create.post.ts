import { z } from 'zod'
import { addTenantDomain, validateDomain } from '../../utils/domain'
import { getTenantId, requireAdminContext } from '../../utils/tenant'

const CreateDomainSchema = z.object({
  domain: z.string().trim().min(1),
  tenantId: z.string().trim().min(1).max(128).optional(),
})

export default eventHandler(async (event) => {
  const { domain, tenantId } = await readValidatedBody(event, CreateDomainSchema.parse)
  const normalizedDomain = validateDomain(domain)
  const { adminDomain } = useRuntimeConfig(event)

  if (adminDomain && normalizedDomain === adminDomain) {
    throw createError({
      status: 409,
      statusText: 'Admin domain cannot be assigned',
    })
  }

  requireAdminContext(event)
  const targetTenantId = tenantId || getTenantId(event)
  await addTenantDomain(event, targetTenantId, normalizedDomain)
  return { success: true, domain: normalizedDomain, tenantId: targetTenantId }
})

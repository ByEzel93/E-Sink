import { z } from 'zod'
import { addTenantDomain, validateDomain } from '../../utils/domain'
import { getTenantId, requireAdminContext } from '../../utils/tenant'

const CreateDomainSchema = z.object({
  domain: z.string().trim().min(1),
})

export default eventHandler(async (event) => {
  const { domain } = await readValidatedBody(event, CreateDomainSchema.parse)
  const normalizedDomain = validateDomain(domain)
  const { adminDomain } = useRuntimeConfig(event)

  if (adminDomain && normalizedDomain === adminDomain) {
    throw createError({
      status: 409,
      statusText: 'Admin domain cannot be assigned',
    })
  }

  requireAdminContext(event)
  const tenantId = getTenantId(event)
  await addTenantDomain(event, tenantId, normalizedDomain)
  return { success: true, domain: normalizedDomain }
})

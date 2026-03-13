import { z } from 'zod'
import { listTenantDomains } from '../../utils/domain'
import { getTenantId, requireAdminContext } from '../../utils/tenant'

const DomainListQuerySchema = z.object({
  tenantId: z.string().trim().min(1).max(128).optional(),
})

export default eventHandler(async (event) => {
  requireAdminContext(event)
  const query = await getValidatedQuery(event, DomainListQuerySchema.parse)
  const tenantId = query.tenantId || getTenantId(event)
  const domains = await listTenantDomains(event, tenantId)
  return { domains, tenantId }
})

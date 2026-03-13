import { listTenantDomains } from '../../utils/domain'
import { getTenantId, requireAdminContext } from '../../utils/tenant'

export default eventHandler(async (event) => {
  requireAdminContext(event)
  const tenantId = getTenantId(event)
  const domains = await listTenantDomains(event, tenantId)
  return { domains }
})

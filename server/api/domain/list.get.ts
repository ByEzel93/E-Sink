import { listTenantDomains } from '../../utils/domain'
import { requireAdminContext } from '../../utils/tenant'

export default eventHandler(async (event) => {
  const { tenantId } = requireAdminContext(event)
  const domains = await listTenantDomains(event, tenantId)
  return { domains }
})

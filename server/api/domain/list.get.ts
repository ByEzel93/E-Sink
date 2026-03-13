import { listTenantDomains } from '../../utils/domain'
import { getTenantId } from '../../utils/tenant'

export default eventHandler(async (event) => {
  const tenantId = getTenantId(event)
  const domains = await listTenantDomains(event, tenantId)
  return { domains }
})

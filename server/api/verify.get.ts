import { requireAuthContext } from '../utils/tenant'

defineRouteMeta({
  openAPI: {
    description: 'Verify the site token',
    responses: {
      200: {
        description: 'The site token is valid',
      },
      default: {
        description: 'The site token is invalid',
      },
    },
  },
})

export default eventHandler((event) => {
  const auth = requireAuthContext(event)
  return {
    name: auth.username,
    tenantId: auth.tenantId,
    isAdmin: auth.isAdmin,
  }
})

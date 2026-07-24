import { canonicalProductionProfile } from './production-profile'

const legacyPostgrestHosts = new Set(['inkcre-pgrst-dea0f3778176.herokuapp.com'])

export const canonicalMetaConfig = {
  INKCRE_PGREST_URL: canonicalProductionProfile.postgrest.url,
  INKCRE_CLIENT_ID: canonicalProductionProfile.core.client_id,
  INKCRE_JWT_SECRET: '',
} as const

export type EndpointStatus =
  | { status: 'canonical'; replacement: null }
  | { status: 'custom'; replacement: null }
  | { status: 'legacy'; replacement: string }
  | { status: 'invalid'; replacement: string }

export function classifyPostgrestEndpoint(value: string): EndpointStatus {
  let endpoint: URL
  try {
    endpoint = new URL(value)
  } catch {
    return {
      status: 'invalid',
      replacement: canonicalProductionProfile.postgrest.url,
    }
  }

  if (endpoint.href === canonicalProductionProfile.postgrest.url) {
    return { status: 'canonical', replacement: null }
  }
  if (
    legacyPostgrestHosts.has(endpoint.hostname) ||
    endpoint.hostname.startsWith('inkcre-pgrst-')
  ) {
    return {
      status: 'legacy',
      replacement: canonicalProductionProfile.postgrest.url,
    }
  }
  return { status: 'custom', replacement: null }
}

export { canonicalProductionProfile } from './production-profile'

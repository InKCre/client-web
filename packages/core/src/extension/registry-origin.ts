import { z } from 'zod'
import { APIError, DBAPIClient } from '../base'

export const DEFAULT_EXTENSION_REGISTRY_ORIGIN = 'https://registry.inkcre.dev'
export const EXTENSION_REGISTRY_CONFIG_KEY = 'extension.registry'
export const EXTENSION_REGISTRY_CONFIG_SCHEMA = 'extension.registry.config.v1'

const RegistryOriginSchema = z.string().transform((value, context) => {
  try {
    const hasAuthorityUserInfo = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*@/i.test(value)
    const url = new URL(value)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      hasAuthorityUserInfo ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error('not an HTTP(S) origin')
    }
    return url.origin
  } catch {
    context.addIssue({
      code: 'custom',
      message: 'Extension Registry URL must be one HTTP(S) origin.',
    })
    return z.NEVER
  }
})

const DeploymentRegistryConfigSchema = z.object({
  schema: z.literal(EXTENSION_REGISTRY_CONFIG_SCHEMA),
  value: z.object({ extension_registry_url: RegistryOriginSchema }),
})

/** Resolve one Registry operation from Peer owner, deployment, then product fallback. */
export class ExtensionRegistryOriginResolver {
  constructor(
    private readonly peerOverride: () => string,
    private readonly database = new DBAPIClient<'configs'>('configs')
  ) {}

  async resolve(): Promise<string> {
    const peerOrigin = this.peerOverride()
    if (peerOrigin) return RegistryOriginSchema.parse(peerOrigin)

    const response = await this.database
      .from()
      .select('schema,value')
      .eq('key', EXTENSION_REGISTRY_CONFIG_KEY)
      .maybeSingle()
    if (response.error) {
      throw new APIError(
        `Extension Registry deployment config failed: ${response.error.message}`,
        response.status,
        response.error
      )
    }
    if (response.data !== null) {
      return DeploymentRegistryConfigSchema.parse(response.data).value.extension_registry_url
    }
    return DEFAULT_EXTENSION_REGISTRY_ORIGIN
  }
}

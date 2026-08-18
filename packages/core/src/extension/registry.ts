import { z } from 'zod'
import { ExtensionNameSchema, ExtensionVersionSchema } from './model'

const ModuleFederationDistributionSchema = z.object({
  manifest_url: z.string().min(1),
  host_sdk: z.literal('@inkcre/core'),
  host_sdk_version: z.string().min(1),
})

const PythonDistributionSchema = z.object({
  project: z.string().min(1),
  simple_url: z.string().min(1),
  host_sdk: z.literal('core-py'),
  host_sdk_version: z.string().min(1),
  entry_point: z.object({
    group: z.string().min(1),
    name: z.string().min(1),
    object: z.string().min(1),
  }),
})

export const ExtensionReleaseSchema = z.object({
  name: ExtensionNameSchema,
  nickname: z.string(),
  version: ExtensionVersionSchema,
  state: z.enum(['preparing', 'published', 'yanked', 'blocked']),
  python: PythonDistributionSchema.nullish(),
  module_federation: ModuleFederationDistributionSchema.nullish(),
})

export type ExtensionRelease = z.infer<typeof ExtensionReleaseSchema>
export type ModuleFederationDistribution = z.infer<typeof ModuleFederationDistributionSchema>

export interface ExtensionReleaseReader {
  get(name: string, version: string): Promise<ExtensionRelease>
}

/** Public exact-Release reader for the Registry control plane. */
export class RegistryExtensionReleaseReader implements ExtensionReleaseReader {
  private readonly fetchImplementation: typeof globalThis.fetch
  private readonly registryOrigin: () => string | Promise<string>

  constructor(
    registryOrigin: string | (() => string | Promise<string>),
    fetchImplementation: typeof globalThis.fetch = globalThis.fetch
  ) {
    this.registryOrigin =
      typeof registryOrigin === 'function' ? registryOrigin : () => registryOrigin
    this.fetchImplementation = fetchImplementation.bind(globalThis)
  }

  async get(name: string, version: string): Promise<ExtensionRelease> {
    const [namespace, localName] = splitExtensionName(ExtensionNameSchema.parse(name))
    const exactVersion = ExtensionVersionSchema.parse(version)
    const registryUrl = await this.registryUrl()
    const location = new URL(
      `/v1/extensions/${encodeURIComponent(namespace)}/${encodeURIComponent(localName)}/releases/${encodeURIComponent(exactVersion)}`,
      registryUrl
    )
    const response = await this.fetchImplementation(location, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`Extension Registry release request failed with HTTP ${response.status}.`)
    }

    const release = ExtensionReleaseSchema.parse(await response.json())
    if (release.name !== name || release.version !== exactVersion) {
      throw new Error('Extension Registry returned a different exact Release coordinate.')
    }
    const distribution = release.module_federation
    if (!distribution) return release
    const manifest = new URL(distribution.manifest_url, registryUrl)
    if (manifest.origin !== registryUrl.origin) {
      throw new Error('Module Federation manifest must be hosted by the configured Registry.')
    }
    return {
      ...release,
      module_federation: { ...distribution, manifest_url: manifest.href },
    }
  }

  private async registryUrl(): Promise<URL> {
    const registryOrigin = await this.registryOrigin()
    if (!registryOrigin) {
      throw new Error('Extension Registry URL is not configured.')
    }
    return new URL(registryOrigin)
  }
}

function splitExtensionName(name: string): [string, string] {
  const [namespace, localName] = name.split('/')
  return [namespace, localName]
}

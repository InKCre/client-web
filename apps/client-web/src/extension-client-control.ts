import {
  InstalledExtensionSchema,
  type ExtensionStatePort,
  type InstalledExtension,
  type WebExtensionHost,
} from '@inkcre/core'

export type ExtensionClientControlMode = 'current-runtime' | 'remote-host' | 'desired-state'

export interface ExtensionClient {
  id: string
  rest_api_url: string | null
  request?(options: {
    method: string
    path: string
    resBodySchema: { parse(input: unknown): InstalledExtension }
  }): Promise<InstalledExtension>
}
type CurrentWebHost = Pick<WebExtensionHost, 'enable' | 'disable'>
type ExtensionDesiredState = Pick<ExtensionStatePort, 'setPeerEnabled'>

export function extensionClientControlMode(
  client: ExtensionClient,
  currentClientId: string
): ExtensionClientControlMode {
  if (client.id === currentClientId) return 'current-runtime'
  if (client.rest_api_url) return 'remote-host'
  return 'desired-state'
}

export async function setExtensionClientEnabled(input: {
  name: string
  client: ExtensionClient
  currentClientId: string
  enabled: boolean
  webHost: CurrentWebHost
  state: ExtensionDesiredState
}): Promise<InstalledExtension> {
  const mode = extensionClientControlMode(input.client, input.currentClientId)
  let updated: InstalledExtension

  if (mode === 'current-runtime') {
    updated = input.enabled
      ? await input.webHost.enable(input.name)
      : await input.webHost.disable(input.name)
  } else if (mode === 'remote-host') {
    if (!input.client.request) {
      throw new Error(`Client ${input.client.id} has no callable management endpoint.`)
    }
    const operation = input.enabled ? 'enable' : 'disable'
    updated = await input.client.request({
      method: 'POST',
      path: `/extensions/${input.name}/${operation}`,
      resBodySchema: InstalledExtensionSchema,
    })
  } else {
    updated = await input.state.setPeerEnabled(input.name, input.client.id, input.enabled)
  }

  const selectedClientIsEnabled = updated.enabled.includes(input.client.id)
  if (selectedClientIsEnabled !== input.enabled) {
    throw new Error(
      `${input.name} did not ${input.enabled ? 'enable' : 'disable'} the selected Client ${input.client.id}.`
    )
  }
  return updated
}

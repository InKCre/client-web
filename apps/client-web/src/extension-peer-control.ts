import {
  InstalledExtensionSchema,
  Peer,
  PeerManager,
  PeerProtocolResponseSchema,
  type ExtensionStatePort,
  type InstalledExtension,
  type WebExtensionHost,
} from '@inkcre/core'

export const EXTENSION_MANAGEMENT_CAPABILITY = 'core.extension.management.v1'
export type ExtensionPeerControlMode = 'current-runtime' | 'remote-host' | 'desired-state'

export function peerAdvertises(peer: Peer, capability: string): boolean {
  try {
    return peer.capabilitySnapshot().some((candidate) => candidate.id === capability)
  } catch {
    return false
  }
}

export function extensionPeerControlMode(
  peer: Peer,
  currentPeerId: string
): ExtensionPeerControlMode {
  if (peer.id === currentPeerId) return 'current-runtime'
  const live = peer.lease_expires_at !== null && peer.lease_expires_at.getTime() > Date.now()
  return live && peerAdvertises(peer, EXTENSION_MANAGEMENT_CAPABILITY)
    ? 'remote-host'
    : 'desired-state'
}

export async function setExtensionPeerEnabled(input: {
  name: string
  peer: Peer
  currentPeerId: string
  enabled: boolean
  webHost: WebExtensionHost
  state: ExtensionStatePort
}): Promise<InstalledExtension> {
  const mode = extensionPeerControlMode(input.peer, input.currentPeerId)
  if (mode === 'current-runtime') {
    return input.enabled ? input.webHost.enable(input.name) : input.webHost.disable(input.name)
  }
  if (mode === 'desired-state') {
    return input.state.setPeerEnabled(input.name, input.peer.id, input.enabled)
  }

  const delegated = await PeerManager.delegate(
    EXTENSION_MANAGEMENT_CAPABILITY,
    {
      body: {
        action: input.enabled ? 'enable' : 'disable',
        extension: input.name,
      },
    },
    input.peer.id
  )
  const response = PeerProtocolResponseSchema.parse(delegated)
  if (response.status !== 200 || response.body === undefined) {
    throw new Error(`Extension management Peer returned HTTP ${response.status} for ${input.name}.`)
  }
  return InstalledExtensionSchema.parse(response.body)
}

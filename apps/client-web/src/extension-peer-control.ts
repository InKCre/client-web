import { ExtensionModel, Peer, type InstalledExtension } from '@inkcre/core'
import {
  EXTENSION_MANAGEMENT_CAPABILITY,
  manageExtensionOnPeer,
  type ExtensionManager,
} from '@inkcre/extension-runtime-client-web'

export { EXTENSION_MANAGEMENT_CAPABILITY }
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
  manager: ExtensionManager
}): Promise<InstalledExtension> {
  const mode = extensionPeerControlMode(input.peer, input.currentPeerId)
  if (mode === 'current-runtime') {
    return input.enabled
      ? input.manager.enable(input.name, input.currentPeerId)
      : input.manager.disable(input.name, input.currentPeerId)
  }
  if (mode === 'desired-state') {
    const extension = await ExtensionModel.get(input.name)
    if (!extension) throw new Error(`Extension ${input.name} is not installed.`)
    return input.enabled
      ? extension.enablePeer(input.peer.id)
      : extension.disablePeer(input.peer.id)
  }

  return manageExtensionOnPeer(input.peer.id, {
    action: input.enabled ? 'enable' : 'disable',
    extension: input.name,
  })
}

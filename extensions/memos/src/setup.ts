import {
  ExtensionModel,
  InstalledExtensionSchema,
  PeerManager,
  PeerProtocolResponseSchema,
  type InstalledExtension,
  type JsonValue,
  type Peer,
} from '@inkcre/core'

export const extensionName = 'inkcre/memos'
const management = 'core.extension.management.v1'
export const tokenPattern = /^memos_pat_[0-9A-Za-z]{32}$/

export function personalAccessToken(extension: InstalledExtension): string | null {
  const token = extension.config.personal_access_token
  return typeof token === 'string' && tokenPattern.test(token) ? token : null
}

export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return `memos_pat_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export function serverUrl(peer: Peer): string | null {
  const value = peer.config.http_public_base_url
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value)
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/memos`
    return url.href
  } catch {
    return null
  }
}

export async function readSetup(): Promise<{ extension: ExtensionModel; peers: Peer[] }> {
  const [extension, peers] = await Promise.all([
    ExtensionModel.get(extensionName),
    PeerManager.listLive(),
  ])
  if (!extension) throw new Error('Memos is not installed.')
  return {
    extension,
    peers: peers.filter((peer) => {
      try {
        return peer.capabilitySnapshot().some((capability) => capability.id === management)
      } catch {
        return false
      }
    }),
  }
}

export async function manageMemos(peer: Peer, body: JsonValue): Promise<InstalledExtension> {
  const result = await PeerManager.delegate(management, { body }, peer.id)
  const response = PeerProtocolResponseSchema.parse(result)
  if (response.status < 200 || response.status >= 300) {
    // Validation payloads can echo the PAT. The UI gives action-specific recovery text instead.
    throw new Error(`Core returned HTTP ${response.status}.`)
  }
  return InstalledExtensionSchema.parse(response.body)
}

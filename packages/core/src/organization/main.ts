import type { BlockRef } from '../info-base'
import { type JsonValue, PeerManager, PeerProtocolResponseSchema, type PeerRef } from '../peer'

export const RUMINATION_CAPABILITY = 'core.organization.rumination.v1'

export class OrganizationDelegationError extends Error {}

export class OrganizationManager {
  static async ruminate(block: BlockRef, routeToPeer: PeerRef | null = null): Promise<void> {
    const delegated = await PeerManager.delegate(
      RUMINATION_CAPABILITY,
      { body: { block } } as JsonValue,
      routeToPeer
    )
    const response = PeerProtocolResponseSchema.safeParse(delegated)
    if (
      !response.success ||
      response.data.status !== 204 ||
      Object.prototype.hasOwnProperty.call(response.data, 'body')
    ) {
      throw new OrganizationDelegationError(
        response.success
          ? `Rumination Peer returned HTTP ${response.data.status}`
          : 'Rumination Peer returned an invalid response'
      )
    }
  }
}

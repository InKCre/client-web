import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient } from '../base'
import { configStore } from '../config'
import { makeObjectProp, makeStringProp } from '../utils/vue-props'
import { PeerCapabilityAdvertisementSchema } from './contracts'

export type PeerRef = string
export const PeerRefSchema = z.uuid()
export const makePeerProp = (value?: Peer) => makeObjectProp<Peer>(value as Peer)
export const makePeerRefProp = (value?: PeerRef) => makeStringProp<PeerRef>(value)

export class Peer extends Z.class({
  id: PeerRefSchema.default(() => crypto.randomUUID()),
  name: z.string(),
  labels: z.array(z.string()).default([]),
  config: z.record(z.string(), z.unknown()).default({}),
  config_schema: z.record(z.string(), z.unknown()).default({}),
  capabilities: z.array(z.unknown()).default([]),
  lease_expires_at: z.coerce.date().nullable().default(null),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
}) {
  static dbApi: DBAPIClient<'peers', Peer> = new DBAPIClient<'peers', Peer>('peers', Peer)

  static async get(id: PeerRef): Promise<Peer> {
    return Peer.parse((await Peer.dbApi.from().select().eq('id', id).single()).data)
  }

  static async list(): Promise<Peer[]> {
    const result = await Peer.dbApi.from().select().order('name', { ascending: true })
    return (result.data ?? []).map((item) => Peer.parse(item))
  }

  static async listAsOptions(): Promise<Array<{ label: string; value: PeerRef }>> {
    return (await Peer.list()).map((peer) => ({ label: peer.name, value: peer.id }))
  }

  static async getSelf(): Promise<Peer> {
    const peer = configStore.metaConfig.INKCRE_PEER_ID
    if (!peer) throw new Error('INKCRE_PEER_ID is not configured')
    return Peer.get(peer)
  }

  capabilitySnapshot() {
    return z.array(PeerCapabilityAdvertisementSchema).parse(this.capabilities)
  }

  async save(): Promise<void> {
    await Peer.dbApi
      .update({ name: this.name, labels: this.labels, config: this.config })
      .eq('id', this.id)
  }

  async saveConfig(): Promise<void> {
    await Peer.dbApi.update({ config: this.config }).eq('id', this.id)
  }
}

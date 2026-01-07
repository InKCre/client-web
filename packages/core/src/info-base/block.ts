import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient } from '../base/db-api'
import { makeNumberProp, makeObjectProp } from '../utils/vue-props'

export type BlockRef = number
export const makeBlockProp = (v?: any) => makeObjectProp<Block>(v)
export const makeBlockRefProp = (v?: any) => makeNumberProp<BlockRef>(v)
export const BlockRefZ = z.number()

/**
 * Block represents a unit of information in the info-base.
 * Each block has a resolver that determines how to display/interpret its content.
 * Blocks can optionally be backed by a storage for retrieving external content.
 */
export class Block extends Z.class({
  id: BlockRefZ,
  created_at: z.coerce
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z.coerce
    .date()
    .optional()
    .default(() => new Date()),
  storage: z.number().nullable(),
  resolver: z.string(),
  content: z.string(),
}) {
  static dbApi: DBAPIClient = new DBAPIClient('blocks', Block)

  static async get(id: BlockRef): Promise<Block> {
    return new Block((await this.dbApi.from().select().eq('id', id)).data![0])
  }

  static async getAll(): Promise<Block[]> {
    return (await this.dbApi.from().select()).data!.map((d) => new Block(d))
  }

  static async getRecent(limit: number = 10): Promise<Block[]> {
    return (
      await this.dbApi.from().select().order('updated_at', { ascending: false }).limit(limit)
    ).data!.map((d) => new Block(d))
  }

  public async update(): Promise<Block> {
    return Block.dbApi.first(await Block.dbApi.from().upsert(this).select())
  }
}

export class BlockForm extends Z.class({
  ...Block.shape,
  id: z.undefined(),
}) {
  public async create() {
    return new Block((await Block.dbApi.from().insert(this).select()).data![0])
  }
}

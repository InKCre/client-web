import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient } from '../base/db-api'
import { BlockRefZ, type BlockRef } from './block'
import { makeNumberProp, makeObjectProp } from '../utils/vue-props'

export type RelationRef = number
export const makeRelationProp = (v?: any) => makeObjectProp<Relation>(v)
export const makeRelationRefProp = (v?: any) => makeNumberProp<RelationRef>(v)
export const RelationRefZ = z.number()

/**
 * Relation represents a directed edge between two blocks in the info-base.
 * Relations can have typed content (e.g., "attachment:photo", "reference:cite").
 */
export class Relation extends Z.class({
  id: RelationRefZ,
  updated_at: z.coerce
    .date()
    .optional()
    .default(() => new Date()),
  from_: BlockRefZ,
  to_: BlockRefZ,
  content: z.string(),
}) {
  static dbApi: DBAPIClient = new DBAPIClient('relations', Relation)

  static async get(id: RelationRef): Promise<Relation> {
    return new Relation((await this.dbApi.from().select().eq('id', id)).data![0])
  }

  static async getAll(): Promise<Relation[]> {
    return (await this.dbApi.from().select()).data!.map((d) => new Relation(d))
  }

  /**
   * Get all relations for a block (where block is from_ or to_).
   * @param blockId - The block ID to find relations for
   */
  static async getByBlock(blockId: BlockRef): Promise<Relation[]> {
    const result = await this.dbApi.from().select().or(`from_.eq.${blockId},to_.eq.${blockId}`)
    return result.data!.map((d) => new Relation(d))
  }

  /**
   * Get relations by content pattern (e.g., "attachment:photo").
   * @param blockId - The block ID to find relations for
   * @param pattern - The content pattern to match (prefix match)
   */
  static async getByPattern(blockId: BlockRef, pattern: string): Promise<Relation[]> {
    const result = await this.dbApi
      .from()
      .select()
      .or(`from_.eq.${blockId},to_.eq.${blockId}`)
      .like('content', `${pattern}%`)
    return result.data!.map((d) => new Relation(d))
  }

  public async update(): Promise<Relation> {
    return Relation.dbApi.first(await Relation.dbApi.from().upsert(this).select())
  }
}

export class RelationForm extends Z.class({
  ...Relation.shape,
  id: z.undefined(),
}) {
  public async create() {
    return new Relation((await Relation.dbApi.from().insert(this).select()).data![0])
  }
}

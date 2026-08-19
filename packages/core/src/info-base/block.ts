import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient } from '../base/db-api'
import { makeNumberProp, makeObjectProp } from '../utils/vue-props'
import { Storage } from './storages/base'

export type BlockRef = number
export const makeBlockProp = (v?: any) => makeObjectProp<Block>(v)
export const makeBlockRefProp = (v?: any) => makeNumberProp<BlockRef>(v)
export const BlockRefZ = z.number()

export type HydratedBlockContent = string | Uint8Array
export type HydrationOptions = {
  refresh?: boolean
}

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
  static dbApi: DBAPIClient<'blocks', Block> = new DBAPIClient<'blocks', Block>('blocks', Block)

  declare private _hydratedContent?: HydratedBlockContent
  declare private _hydratedContentSource?: string

  static async get(id: BlockRef): Promise<Block> {
    const block = await this.find(id)
    if (!block) throw new Error(`Block ${id} does not exist`)
    return block
  }

  static async find(id: BlockRef): Promise<Block | null> {
    const row = (await this.dbApi.from().select().eq('id', id).maybeSingle()).data
    return row ? Block.parse(row) : null
  }

  static async getAll(): Promise<Block[]> {
    return ((await this.dbApi.from().select()).data ?? []).map((item) => Block.parse(item))
  }

  static async getMany(ids: Iterable<BlockRef>): Promise<Block[]> {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) return []
    const result = await this.dbApi.from().select().in('id', uniqueIds)
    if (result.error) throw result.error
    return (result.data ?? []).map((item) => Block.parse(item))
  }

  static async getRandom(): Promise<Block | null> {
    const countResult = await this.dbApi.from().select('*', { count: 'exact', head: true })
    if (countResult.error) throw countResult.error
    const count = countResult.count ?? 0
    if (count === 0) return null
    const offset = Math.floor(Math.random() * count)
    const result = await this.dbApi
      .from()
      .select()
      .order('id', { ascending: true })
      .range(offset, offset)
      .maybeSingle()
    if (result.error) throw result.error
    return result.data ? Block.parse(result.data) : null
  }

  static async getRecent(limit: number = 10): Promise<Block[]> {
    return (
      (
        await this.dbApi.from().select().order('updated_at', { ascending: false }).limit(limit)
      ).data?.map((item) => Block.parse(item)) ?? []
    )
  }

  public async update(): Promise<Block> {
    return Block.dbApi.first(await Block.dbApi.upsert(this).select())
  }

  public async getHydratedContent(options: HydrationOptions = {}): Promise<HydratedBlockContent> {
    const source = `${this.storage ?? 'inline'}\0${this.content}`
    if (!options.refresh && this._hydratedContentSource === source) {
      return this._hydratedContent as HydratedBlockContent
    }

    let hydratedContent: HydratedBlockContent
    if (this.storage === null) {
      hydratedContent = this.content
    } else {
      const storage = await Storage.get<Uint8Array>(this.storage)
      const storedContent = await storage.getRawContent(this)
      if (!(storedContent instanceof Uint8Array)) {
        throw new TypeError(`Storage ${storage.type} must return Uint8Array content.`)
      }
      hydratedContent = storedContent
    }

    Object.defineProperties(this, {
      _hydratedContent: {
        configurable: true,
        enumerable: false,
        value: hydratedContent,
        writable: true,
      },
      _hydratedContentSource: {
        configurable: true,
        enumerable: false,
        value: source,
        writable: true,
      },
    })
    return hydratedContent
  }
}

export class BlockForm extends Z.class({
  ...Block.shape,
  id: z.undefined(),
}) {
  public async create() {
    return Block.parse((await Block.dbApi.insert(this).select()).data?.[0])
  }
}

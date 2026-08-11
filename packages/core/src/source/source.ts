import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient } from '../base/db-api'
import { makeNumberProp, makeObjectProp } from '../utils/vue-props'
import { SourceTypeRefZ } from './source-type'

export type SourceRef = number
export const makeSourceProp = (v?: any) => makeObjectProp<Source>(v)
export const makeSourceRefProp = (v?: any) => makeNumberProp<SourceRef>(v)
export const SourceRefZ = z.number()

export class Source extends Z.class({
  id: SourceRefZ,
  type: SourceTypeRefZ,
  nickname: z.string().nullable(),
  config: z.looseObject({}).default(() => ({})),
  state: z.looseObject({}).default(() => ({})),
  storage: z.number().int().nullable(),
  block: z.number().int().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
}) {
  static dbApi: DBAPIClient<'sources', Source> = new DBAPIClient<'sources', Source>(
    'sources',
    Source
  )

  static async get(id: SourceRef): Promise<Source> {
    return Source.parse((await this.dbApi.from().select().eq('id', id).single()).data)
  }

  static async getAll(): Promise<Source[]> {
    return ((await this.dbApi.from().select()).data ?? []).map((item) => Source.parse(item))
  }

  public async save(): Promise<Source> {
    return Source.dbApi.first(await Source.dbApi.upsert(this).select())
  }

  async delete(): Promise<void> {
    await Source.dbApi.from().delete().eq('id', this.id)
  }
}

export class SourceForm extends Z.class({
  type: SourceTypeRefZ,
  nickname: z.string().nullable().default(null),
  config: z.looseObject({}).default(() => ({})),
  state: z.looseObject({}).default(() => ({})),
  storage: z.number().int().nullable().default(null),
}) {
  public async create() {
    return Source.parse((await Source.dbApi.insert(this).select().single()).data)
  }
}

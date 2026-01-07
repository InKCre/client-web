import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient } from '../base/db-api'
import { makeNumberProp, makeObjectProp } from '../utils/vue-props'
import { zinstance } from '../utils/zinstance'
import { CollectAt } from './collect-at'
import { SourceTypeRefZ } from './source-type'

export type SourceRef = number
export const makeSourceProp = (v?: any) => makeObjectProp<Source>(v)
export const makeSourceRefProp = (v?: any) => makeNumberProp<SourceRef>(v)
export const SourceRefZ = z.number()

export class Source extends Z.class({
  id: SourceRefZ,
  type: SourceTypeRefZ,
  nickname: z.string(),
  config: z.looseObject({}).default(() => ({})),
  collect_at: zinstance<CollectAt>(CollectAt).nullable(),
}) {
  static dbApi: DBAPIClient = new DBAPIClient('sources', Source)

  static async get(id: SourceRef): Promise<Source> {
    return new Source((await this.dbApi.from().select().eq('id', id).single()).data!)
  }

  static async getAll(): Promise<Source[]> {
    return (await this.dbApi.from().select()).data!.map((d) => new Source(d))
  }

  public async save(): Promise<Source> {
    return Source.dbApi.first(await Source.dbApi.from().upsert(this).select())
  }

  async delete(): Promise<void> {
    await Source.dbApi.from().delete().eq('id', this.id)
  }
}

export class SourceForm extends Z.class({
  ...Source.shape,
  id: z.undefined(),
}) {
  public async create() {
    return new Source((await Source.dbApi.from().insert(this).select().single()).data!)
  }
}

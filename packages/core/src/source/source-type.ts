import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient } from '../base/db-api'

export type SourceTypeRef = string
export const SourceTypeRefZ = z.string()

export class SourceType extends Z.class({
  id: SourceTypeRefZ,
  description: z.string(),
  config_schema: z.looseObject({}).default(() => ({})),
}) {
  static dbApi: DBAPIClient<'sources_types', SourceType> = new DBAPIClient<
    'sources_types',
    SourceType
  >('sources_types', SourceType)

  static async get(id: SourceTypeRef): Promise<SourceType> {
    return SourceType.parse((await this.dbApi.from().select().eq('id', id).single()).data)
  }

  static async getAll(): Promise<SourceType[]> {
    return ((await this.dbApi.from().select()).data ?? []).map((item) => SourceType.parse(item))
  }
}

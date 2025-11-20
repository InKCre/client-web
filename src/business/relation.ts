import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient, CoreAPIClient } from './base'
import { BlockRefZ } from './block'
import { makeNumberProp, makeObjectProp } from '@/utils/vue-props'

export type RelationRef = number
export const makeRelationProp = (v?: any) => makeObjectProp<Relation>(v);
export const makeRelationRefProp = (v?: any) => makeNumberProp<RelationRef>(v);
export const RelationRefZ = z.number()

export class Relation extends Z.class({
    id: RelationRefZ,
    updated_at: z.date().optional().default(() => new Date()),
    from_: BlockRefZ,
    to_: BlockRefZ,
    content: z.string(),
}) {

    static dbApi = new DBAPIClient<Relation>('relations', Relation)
    static coreApi: CoreAPIClient = new CoreAPIClient('/relation', Relation)

    static async get(id: RelationRef): Promise<Relation> {
        return this.dbApi.parseSingle((await this.dbApi.select().eq('id', id)).data![0])
    }

    public async update(): Promise<Relation> {
        return Relation.dbApi.parseSingle((await Relation.dbApi.upsert(this).select()).data![0])
    }

}

export class RelationForm extends Z.class({
    ...Relation.shape,
    id: z.undefined()
}) {

    public async create() {
        return Relation.dbApi.parseSingle((await Relation.dbApi.insert(this).select()).data![0])
    }

}
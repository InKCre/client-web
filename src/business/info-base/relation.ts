import { z } from "zod";
import { Z } from "zod-class";
import { DBAPIClient, CoreAPIClient } from "../api";
import { BlockRefZ } from "./block";
import { makeNumberProp, makeObjectProp } from "@/utils/vue-props";

export type RelationRef = number;
export const makeRelationProp = (v?: any) => makeObjectProp<Relation>(v);
export const makeRelationRefProp = (v?: any) => makeNumberProp<RelationRef>(v);
export const RelationRefZ = z.number();

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
  static dbApi: DBAPIClient = new DBAPIClient("relations", Relation);
  static coreApi: CoreAPIClient = new CoreAPIClient("/relation", Relation);

  static async get(id: RelationRef): Promise<Relation> {
    return new Relation(
      (await this.dbApi.from().select().eq("id", id)).data![0]
    );
  }

  static async getAll(): Promise<Relation[]> {
    return (await this.dbApi.from().select()).data!.map((d) => new Relation(d));
  }

  public async update(): Promise<Relation> {
    return Relation.dbApi.first(
      await Relation.dbApi.from().upsert(this).select()
    );
  }
}

export class RelationForm extends Z.class({
  ...Relation.shape,
  id: z.undefined(),
}) {
  public async create() {
    return new Relation(
      (await Relation.dbApi.from().insert(this).select()).data![0]
    );
  }
}

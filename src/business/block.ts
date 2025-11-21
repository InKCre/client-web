import { z } from "zod";
import { Z } from "zod-class";
import { DBAPIClient, CoreAPIClient } from "./base";
import { makeNumberProp, makeObjectProp } from "@/utils/vue-props";

export type BlockRef = number;
export const makeBlockProp = (v?: any) => makeObjectProp<Block>(v);
export const makeBlockRefProp = (v?: any) => makeNumberProp<BlockRef>(v);
export const BlockRefZ = z.number();

export class Block extends Z.class({
  id: BlockRefZ,
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
  storage: z.string().nullable().optional(),
  resolver: z.string(),
  content: z.string(),
}) {
  static dbApi: DBAPIClient = new DBAPIClient("blocks", Block);
  static coreApi: CoreAPIClient = new CoreAPIClient("/blocks", Block);

  static async get(id: BlockRef): Promise<Block> {
    return new Block((await this.dbApi.select().eq("id", id)).data![0]);
  }

  public async update(): Promise<Block> {
    return Block.dbApi.first(await Block.dbApi.upsert(this).select());
  }
}

export class BlockForm extends Z.class({
  ...Block.shape,
  id: z.undefined(),
}) {
  public async create() {
    return new Block((await Block.dbApi.insert(this).select()).data![0]);
  }
}

import { z } from "zod";
import { Z } from "zod-class";
import { DBAPIClient, CoreAPIClient } from "./api";
import { makeNumberProp, makeObjectProp } from "@/utils/vue-props";

export type SourceRef = number;
export const makeSourceProp = (v?: any) => makeObjectProp<Source>(v);
export const makeSourceRefProp = (v?: any) => makeNumberProp<SourceRef>(v);
export const SourceRefZ = z.number();

export class Source extends Z.class({
  id: SourceRefZ,
  created_at: z
    .date()
    .optional()
    .default(() => new Date()),
  updated_at: z
    .date()
    .optional()
    .default(() => new Date()),
  name: z.string(),
  resolver: z.string(),
  config: z.looseObject({}).nullable().optional(),
}) {
  static dbApi: DBAPIClient = new DBAPIClient("sources", Source);
  static coreApi: CoreAPIClient<Source> = new CoreAPIClient("/source", Source);

  static async get(id: SourceRef): Promise<Source> {
    return new Source((await this.dbApi.select().eq("id", id)).data![0]);
  }

  public async update(): Promise<Source> {
    return Source.dbApi.first(await Source.dbApi.upsert(this).select());
  }

  async collect(options: { full?: boolean } = {}): Promise<void> {
    await Source.coreApi.requestHttp<any[]>({
      method: "GET",
      path: `/${this.id}/collect`,
      query: options,
    });
  }
}

export class SourceForm extends Z.class({
  ...Source.shape,
  id: z.undefined(),
}) {
  public async create() {
    return new Source((await Source.dbApi.insert(this).select()).data![0]);
  }
}

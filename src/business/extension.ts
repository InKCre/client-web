import { z } from "zod";
import { Z } from "zod-class";
import { CoreAPIClient, DBAPIClient } from "./api";
import { makeStringProp, makeObjectProp } from "@/utils/vue-props";
import { zinstance } from "./base";

export type ExtensionRef = string;
export const makeExtensionProp = (v?: any) => makeObjectProp<Extension>(v);
export const makeExtensionRefProp = (v?: any) =>
  makeStringProp<ExtensionRef>(v);
export const ExtensionRefZ = z.string();

export class Extension extends Z.class({
  id: ExtensionRefZ,
  version: z.string(),
  disabled: z.boolean().optional().default(false),
  nickname: z.string().nullable().optional(),
  config: z.looseObject({}).nullable().optional(),
  state: z.looseObject({}).nullable().optional(),
}) {
  static coreApi: CoreAPIClient = new CoreAPIClient<Extension>(
    "/extensions",
    Extension
  );
  static dbApi: DBAPIClient = new DBAPIClient<Extension>(
    "extensions",
    Extension
  );

  static async get(id: ExtensionRef): Promise<Extension> {
    return new Extension(
      (await Extension.dbApi.select().eq("id", id).single()).data!
    );
  }

  static async list(): Promise<Extension[]> {
    const results = await Extension.dbApi
      .select()
      .order("id", { ascending: true });
    return results.data!.map((item) => new Extension(item));
  }

  async enable(): Promise<Extension> {
    return Extension.coreApi.request<Extension>({
      method: "PUT",
      path: `/${this.id}/disabled/false`,
    });
  }

  async disable(): Promise<Extension> {
    return Extension.coreApi.request<Extension>({
      method: "PUT",
      path: `/${this.id}/disabled/true`,
    });
  }

  async updateConfig(config?: Record<string, any>): Promise<Extension> {
    return Extension.coreApi.request<Extension>({
      method: "PUT",
      path: `/${this.id}/config`,
      body: config || this.config,
    });
  }
}

export class ExtensionForm extends Z.class({
  id: ExtensionRefZ,
  version: z.string().optional(),
  disabled: z.boolean().optional(),
}) {
  async install(): Promise<Extension> {
    const params = new URLSearchParams();
    if (this.version) {
      params.append("version", this.version);
    }
    if (this.disabled !== undefined) {
      params.append("disabled", String(this.disabled));
    }

    const path = `/${this.id}?${params.toString()}`;
    const result = await Extension.coreApi.request<Extension>({
      method: "POST",
      path: path,
    });
    return new Extension(result);
  }
}

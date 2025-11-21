import { z } from "zod";
import { Z } from "zod-class";
import { CoreAPIClient } from "./base";
import { makeStringProp, makeObjectProp } from "@/utils/vue-props";

export type ExtensionRef = string;
export const makeExtensionProp = (v?: any) => makeObjectProp<Extension>(v);
export const makeExtensionRefProp = (v?: any) => makeStringProp<ExtensionRef>(v);
export const ExtensionRefZ = z.string();

export class Extension extends Z.class({
  id: ExtensionRefZ,
  version: z.string(),
  disabled: z.boolean().optional().default(false),
  nickname: z.string().nullable().optional(),
  config: z.record(z.string(), z.any()).nullable().optional(),
  state: z.record(z.string(), z.any()).nullable().optional(),
}) {
  static coreApi: CoreAPIClient = new CoreAPIClient<Extension>("/extensions", Extension);

  static async get(id: ExtensionRef): Promise<Extension> {
    const result = await this.coreApi.requestHttp({
      method: "GET",
      path: `/${id}`,
    });
    return new Extension(result);
  }

  static async list(): Promise<Extension[]> {
    const results = await this.coreApi.requestHttp<Extension[]>({
      method: "GET",
      path: "",
      resBodySchema: z.array(Extension) as any,
    });
    return results.map((item) => new Extension(item));
  }

  async enable(): Promise<Extension> {
    const result = await Extension.coreApi.requestHttp<Extension>({
      method: "PUT",
      path: `/${this.id}/disabled/false`,
    });
    return new Extension(result);
  }

  async disable(): Promise<Extension> {
    const result = await Extension.coreApi.requestHttp<Extension>({
      method: "PUT",
      path: `/${this.id}/disabled/true`,
    });
    return new Extension(result);
  }

  async updateConfig(config: Record<string, any>): Promise<Extension> {
    const result = await Extension.coreApi.requestHttp<Extension>({
      method: "PUT",
      path: `/${this.id}/config`,
      body: config,
    });
    return new Extension(result);
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
    const result = await Extension.coreApi.requestHttp<Extension>({
      method: "POST",
      path: path,
    });
    return new Extension(result);
  }
}

import { z } from "zod";
import { Z } from "zod-class";
import { CoreAPIClient, DBAPIClient } from "./api";
import { makeStringProp, makeObjectProp } from "@/utils/vue-props";

export type ClientRef = string;
export const makeClientProp = (v?: any) => makeObjectProp<Client>(v);
export const makeClientRefProp = (v?: any) => makeStringProp<ClientRef>(v);
export const ClientRefZ = z.uuid();

/**
 * Client
 *
 * All clients are equal peers.
 */
export class Client extends Z.class({
  id: ClientRefZ.default(() => crypto.randomUUID()),
  /** Client Nickname */
  name: z.string(),
  labels: z.array(z.string()).default([]),
  rest_api_url: z.url().nullable().default(null),
  created_at: z.string(),
}) {
  static coreApi: CoreAPIClient = new CoreAPIClient<Client>("/clients", Client);
  static dbApi: DBAPIClient = new DBAPIClient<Client>("clients", Client);

  /**
   * 获取单个客户端
   */
  static async get(id: ClientRef): Promise<Client> {
    return new Client(
      (await Client.dbApi.from().select().eq("id", id).single()).data!
    );
  }

  /**
   * 获取所有客户端
   */
  static async list(): Promise<Client[]> {
    const results = await Client.dbApi
      .from()
      .select()
      .order("name", { ascending: true });
    return results.data!.map((item) => new Client(item));
  }

  /**
   * Ping 客户端检查在线状态
   */
  async ping(): Promise<"online" | "offline"> {
    try {
      const response = await fetch(`${this.rest_api_url}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5秒超时
      });
      return response.ok ? "online" : "offline";
    } catch (error) {
      console.error(`[Client] Ping failed for ${this.id}:`, error);
      return "offline";
    }
  }

  /**
   * 向远程客户端发送请求
   */
  async request<T = any>(options: {
    method: string;
    path: string;
    body?: any;
    query?: Record<string, any>;
  }): Promise<T> {
    const { method, path, body, query } = options;
    const url = new URL(`${this.rest_api_url}${path}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[Client] Request failed for ${this.id}:`, error);
      throw error;
    }
  }
}

/**
 * 创建客户端的表单
 */
export class CreateClientForm extends Z.class({
  name: z.string().min(1),
  description: z.string().optional(),
  rest_api_url: z.url(),
}) {
  async create(): Promise<Client> {
    return new Client(
      (await Client.dbApi.from().insert(this).select().single()).data!
    );
  }
}

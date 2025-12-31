import { z } from "zod";
import { Z } from "zod-class";
import { CoreAPIClient, DBAPIClient } from "./api";
import { makeStringProp, makeObjectProp } from "@/utils/vue-props";

export type ClientRef = string;
export const makeClientProp = (v?: any) => makeObjectProp<Client>(v);
export const makeClientRefProp = (v?: any) =>
  makeStringProp<ClientRef>(v);
export const ClientRefZ = z.string().uuid();

/**
 * Client 模型
 * 在这个系统中，每个节点都是平等的客户端
 * 不存在传统意义上的"后端"，所有节点都可以相互通信
 */
export class Client extends Z.class({
  id: ClientRefZ,
  name: z.string(),
  description: z.string().nullable().optional(),
  rest_api_url: z.string().url(),
  status: z.enum(["online", "offline", "unknown"]).default("unknown"),
  created_at: z.string(),
  updated_at: z.string(),
  last_seen_at: z.string().nullable().optional(),
}) {
  static coreApi: CoreAPIClient = new CoreAPIClient<Client>(
    "/clients",
    Client
  );
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
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`[Client] Request failed for ${this.id}:`, error);
      throw error;
    }
  }

  /**
   * 在远程客户端上启用插件
   */
  async enableExtension(extensionId: string): Promise<void> {
    await this.request({
      method: "POST",
      path: `/extensions/${extensionId}/enable`,
      body: { client_id: this.id },
    });
  }

  /**
   * 在远程客户端上禁用插件
   */
  async disableExtension(extensionId: string): Promise<void> {
    await this.request({
      method: "POST",
      path: `/extensions/${extensionId}/disable`,
      body: { client_id: this.id },
    });
  }
}

/**
 * 创建客户端的表单
 */
export class CreateClientForm extends Z.class({
  name: z.string().min(1),
  description: z.string().optional(),
  rest_api_url: z.string().url(),
}) {
  async create(): Promise<Client> {
    const result = await Client.coreApi.request<Client>({
      method: "POST",
      path: "",
      body: this,
    });
    return new Client(result);
  }
}

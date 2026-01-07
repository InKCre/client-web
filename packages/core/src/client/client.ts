import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient } from '../base/db-api'
import { makeStringProp, makeObjectProp } from '../utils/vue-props'
import { authStore } from '../auth'

export type ClientRef = string
export const makeClientProp = (v?: any) => makeObjectProp<Client>(v)
export const makeClientRefProp = (v?: any) => makeStringProp<ClientRef>(v)
export const ClientRefZ = z.uuid()

/**
 * Client
 *
 * All clients are equal peers. Each client can make requests to other clients
 * through their REST API endpoints.
 */
export class Client extends Z.class({
  id: ClientRefZ.default(() => crypto.randomUUID()),
  /** Client Nickname */
  name: z.string(),
  labels: z.array(z.string()).default([]),
  rest_api_url: z.url().nullable().default(null),
  created_at: z.coerce.date().default(() => new Date()),
}) {
  static dbApi: DBAPIClient = new DBAPIClient<Client>('clients', Client)

  /**
   * Get a single client by ID
   */
  static async get(id: ClientRef): Promise<Client> {
    return new Client((await Client.dbApi.from().select().eq('id', id).single()).data!)
  }

  /**
   * List all clients
   */
  static async list(): Promise<Client[]> {
    const results = await Client.dbApi.from().select().order('name', { ascending: true })
    return results.data!.map((item) => new Client(item))
  }

  /**
   * List clients formatted as options for select inputs
   */
  static async listAsOptions(): Promise<Array<{ label: string; value: ClientRef }>> {
    const clients = await Client.list()
    return clients.map((client) => ({
      label: client.name,
      value: client.id,
    }))
  }

  /**
   * Ping client to check online status
   */
  async ping(): Promise<'online' | 'offline'> {
    try {
      const response = await fetch(`${this.rest_api_url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5s timeout
      })
      return response.ok ? 'online' : 'offline'
    } catch (error) {
      console.error(`[Client] Ping failed for ${this.id}:`, error)
      return 'offline'
    }
  }

  /**
   * Send request to this client's REST API endpoint
   *
   * This enables peer-to-peer communication where Client A can make
   * requests to Client B's API.
   */
  async request<T = any>(options: {
    method: string
    path: string
    body?: any
    query?: Record<string, any>
  }): Promise<T> {
    const { method, path, body, query } = options
    if (!this.rest_api_url) {
      throw new Error(`Client ${this.id} does not have a REST API URL configured.`)
    }
    const url = new URL(`${this.rest_api_url}${path}`)

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    const config: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${await authStore.getToken()}`,
      },
    }

    if (body !== undefined) {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`[Client] Request failed for ${this.id}:`, error)
      throw error
    }
  }
}

/**
 * Form for creating/updating clients
 */
export class CreateClientForm extends Z.class({
  ...Client.shape,
}) {
  async upsert(): Promise<Client> {
    return new Client((await Client.dbApi.from().upsert(this).select().single()).data!)
  }
}

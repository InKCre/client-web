import { z } from 'zod'
import { Z } from 'zod-class'
import { DBAPIClient, APIError } from '../base/db-api'
import { makeStringProp, makeObjectProp } from '../utils/vue-props'
import { authStore, signDatabaseToken } from '../auth'
import { ClientConfigSchema, configStore, type ClientConfig, type MetaConfig } from '../config'

export type ClientRef = string
export const makeClientProp = (v?: any) => makeObjectProp<Client>(v)
export const makeClientRefProp = (v?: any) => makeStringProp<ClientRef>(v)
export const ClientRefZ = z.uuid()

function restApiUrl(baseUrl: string, path: string): URL {
  return new URL(`${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`)
}

/**
 * Client Active Record
 *
 * Clients represent API endpoints in the system. Each client has a REST API URL
 * and provides methods for making authenticated requests to that endpoint.
 *
 * This class consolidates both peer-to-peer communication and Core API requests.
 * To make a request, instantiate a Client by ID and use the request methods.
 */
export class Client extends Z.class({
  id: ClientRefZ.default(() => crypto.randomUUID()),
  /** Client Nickname */
  name: z.string(),
  labels: z.array(z.string()).default([]),
  rest_api_url: z.url().nullable().default(null),
  config: z.looseObject({}).default({}),
  config_schema: z.looseObject({}).default({}),
  created_at: z.coerce.date().default(() => new Date()),
}) {
  static dbApi: DBAPIClient<'clients', Client> = new DBAPIClient<'clients', Client>(
    'clients',
    Client
  )

  /**
   * Get a single client by ID
   */
  static async get(id: ClientRef): Promise<Client> {
    return Client.parse((await Client.dbApi.from().select().eq('id', id).single()).data)
  }

  /**
   * List all clients
   */
  static async list(): Promise<Client[]> {
    const results = await Client.dbApi.from().select().order('name', { ascending: true })
    return (results.data ?? []).map((item) => Client.parse(item))
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

  /** Get the browser-owned Client from bootstrap configuration. */
  static async getSelf(): Promise<Client> {
    return Client.get(configStore.metaConfig.client_id)
  }

  /**
   * Prove one candidate bootstrap configuration and persist this browser's
   * typed Client configuration. The candidate connection is isolated from the
   * currently active application configuration.
   */
  static async connect(meta: MetaConfig, config: ClientConfig): Promise<Client> {
    const candidate = new DBAPIClient<'clients', Client>(
      'clients',
      Client,
      'inkcre',
      meta.INKCRE_PGREST_URL,
      () => signDatabaseToken(meta.INKCRE_JWT_SECRET)
    )
    const existingResponse = await candidate.from().select().eq('id', meta.client_id).maybeSingle()
    if (existingResponse.error) {
      throw new APIError(
        `Client database connection failed: ${existingResponse.error.message}`,
        existingResponse.status,
        existingResponse.error
      )
    }

    const parsedConfig = ClientConfigSchema.parse(config)
    if (existingResponse.data) {
      const updateResponse = await candidate
        .update({
          config: parsedConfig,
          config_schema: z.toJSONSchema(ClientConfigSchema),
        })
        .eq('id', meta.client_id)
        .select()
        .single()
      if (updateResponse.error) {
        throw new APIError(
          `Client configuration save failed: ${updateResponse.error.message}`,
          updateResponse.status,
          updateResponse.error
        )
      }
      return Client.parse(updateResponse.data)
    }

    const createResponse = await candidate
      .insert({
        id: meta.client_id,
        name: 'client-web',
        labels: ['web'],
        rest_api_url: null,
        config: parsedConfig,
        config_schema: z.toJSONSchema(ClientConfigSchema),
      })
      .select()
      .single()
    if (createResponse.error) {
      throw new APIError(
        `Client registration failed: ${createResponse.error.message}`,
        createResponse.status,
        createResponse.error
      )
    }
    return Client.parse(createResponse.data)
  }

  /**
   * Get auth headers for requests
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    return {
      Authorization: `Bearer ${await authStore.getToken()}`,
    }
  }

  /**
   * Ping client to check online status
   */
  async ping(): Promise<'online' | 'offline'> {
    if (!this.rest_api_url) {
      return 'offline'
    }
    try {
      const response = await fetch(restApiUrl(this.rest_api_url, '/health'), {
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
   * Make a request to this client's REST API endpoint.
   *
   * Supports full HTTP request capabilities including:
   * - Multiple HTTP methods (GET, POST, PUT, PATCH, DELETE)
   * - JSON body or FormData/Blob
   * - Query parameters
   * - Schema-based response parsing
   * - Automatic authentication
   * - Token refresh on 401 errors
   *
   * @param options Request options
   * @returns Parsed response data
   * @throws APIError if the request fails
   */
  async request<T = any>(options: {
    method: string
    path: string
    body?: any
    query?: Record<string, any>
    resBodySchema?: { parse(input: unknown): T }
    signal?: AbortSignal
  }): Promise<T> {
    const { method, path, body, query, resBodySchema, signal } = options
    const parseSuccessfulResponse = async (response: Response): Promise<T> => {
      if (response.status === 204) {
        return undefined as T
      }
      const responseData = await response.json()
      return resBodySchema ? resBodySchema.parse(responseData) : responseData
    }

    if (!this.rest_api_url) {
      throw new Error(`Client ${this.id} does not have a REST API URL configured.`)
    }

    const url = restApiUrl(this.rest_api_url, path)
    const headers = await this.getAuthHeaders()

    const config: RequestInit = {
      method,
      headers,
      signal,
    }

    if (body !== undefined) {
      if (
        typeof body === 'object' &&
        body !== null &&
        !(body instanceof FormData) &&
        !(body instanceof Blob) &&
        !(body instanceof ArrayBuffer)
      ) {
        // JSON
        config.body = JSON.stringify(body)
        headers['Content-Type'] = 'application/json'
      } else {
        // FormData / Blob / string / ArrayBuffer
        config.body = body
      }
    }

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let responseData

        try {
          responseData = await response.json()
          if (typeof responseData.message === 'string') {
            errorMessage = responseData.message
          } else if (typeof responseData.error === 'string') {
            errorMessage = responseData.error
          } else if (
            typeof responseData.detail === 'string' &&
            responseData.detail.length <= 1000
          ) {
            errorMessage = responseData.detail
          }
        } catch {
          // If response is not JSON, use status text
        }

        // If unauthorized, try refreshing token and retry once
        if (response.status === 401) {
          try {
            await authStore.refreshToken()
            const retryResponse = await fetch(url, {
              ...config,
              headers: { ...headers, ...(await this.getAuthHeaders()) },
            })

            if (retryResponse.ok) {
              return parseSuccessfulResponse(retryResponse)
            }
          } catch (retryError) {
            console.warn('[Client] Token refresh and retry failed:', retryError)
          }
        }

        throw new APIError(errorMessage, response.status, responseData)
      }

      return parseSuccessfulResponse(response)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError(error instanceof Error ? error.message : 'Network error', 0)
    }
  }

  /**
   * Convenience method for GET requests
   */
  async get<T = any>(
    path: string,
    query?: Record<string, any>,
    resBodySchema?: { parse(input: unknown): T }
  ): Promise<T> {
    return this.request<T>({ method: 'GET', path, query, resBodySchema })
  }

  /**
   * Convenience method for POST requests
   */
  async post<T = any>(
    path: string,
    body?: any,
    resBodySchema?: { parse(input: unknown): T }
  ): Promise<T> {
    return this.request<T>({ method: 'POST', path, body, resBodySchema })
  }

  /**
   * Convenience method for PUT requests
   */
  async put<T = any>(
    path: string,
    body?: any,
    resBodySchema?: { parse(input: unknown): T }
  ): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body, resBodySchema })
  }

  /**
   * Convenience method for PATCH requests
   */
  async patch<T = any>(
    path: string,
    body?: any,
    resBodySchema?: { parse(input: unknown): T }
  ): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body, resBodySchema })
  }

  /**
   * Convenience method for DELETE requests
   */
  async delete<T = any>(path: string, resBodySchema?: { parse(input: unknown): T }): Promise<T> {
    return this.request<T>({ method: 'DELETE', path, resBodySchema })
  }

  /**
   * Save only the config field to the database
   */
  async saveConfig(): Promise<void> {
    const response = await Client.dbApi
      .update({ config: this.config, config_schema: this.config_schema })
      .eq('id', this.id)
      .select()
      .single()
    if (response.error) {
      throw new APIError(
        `Client configuration save failed: ${response.error.message}`,
        response.status,
        response.error
      )
    }
  }
}

/**
 * Form for creating clients
 */
export class CreateClientForm extends Z.class({
  ...Client.shape,
}) {
  async upsert(): Promise<Client> {
    return Client.parse((await Client.dbApi.upsert(this).select().single()).data)
  }
}

import { configStore as sharedConfigStore } from '../config'
import { authStore } from '../auth'
import { PostgrestClient, PostgrestQueryBuilder } from '@supabase/postgrest-js'
import { watch } from 'vue'

/**
 * API Error class for handling API request errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Unified API Client combining PostgREST database operations and custom Core API endpoints.
 * Extends PostgrestClient with additional HTTP request capabilities.
 *
 * This consolidated client provides:
 * - PostgREST methods (`.from()`, `.rpc()`) for database operations
 * - Custom endpoint methods (`.request()`, `.get()`, `.post()`) for Core API calls
 * - Automatic authentication via authStore
 * - Reactive config updates via configStore
 *
 * @template DT - Data type for the records in the specified relation
 */
export class DBAPIClient<DT = any> extends PostgrestClient {
  protected configStore = sharedConfigStore
  protected coreBaseURL: string
  protected pathPrefix: string

  /**
   * @param relation - Database relation (table) name for PostgREST operations
   * @param defSchema - Optional default schema for parsing responses
   * @param pathPrefix - Optional path prefix for Core API requests (format: `/...`)
   * @param schemaName - PostgreSQL schema name (default: "public")
   * @param baseUrl - Base URL of the PostgREST API (default: from CONFIG)
   */
  constructor(
    protected relation: string,
    protected defSchema?: { parse<DT>(input: unknown): DT },
    pathPrefix: string = '',
    public schemaName: 'public' = 'public',
    baseUrl: string = ''
  ) {
    super(baseUrl, {
      schema: schemaName,
      // Custom fetch to dynamically inject auth token on each request
      fetch: async (input, init) => {
        const token = await authStore.getToken()
        const headers = new Headers(init?.headers)
        headers.set('Authorization', `Bearer ${token}`)
        return fetch(input, { ...init, headers })
      },
    })

    this.pathPrefix = pathPrefix
    this.coreBaseURL = `${this.configStore.config.INKCRE_CORE_URL}${pathPrefix}`

    // If no baseUrl provided, use configStore and watch for changes
    if (!baseUrl) {
      watch(
        () => this.configStore.config.INKCRE_PGREST_URL,
        (newVal) => {
          this.url = newVal
        },
        { immediate: true }
      )
    }

    // Watch for Core API URL changes
    watch(
      () => this.configStore.config.INKCRE_CORE_URL,
      (newVal) => {
        this.coreBaseURL = `${newVal}${pathPrefix}`
      }
    )
  }

  /**
   * Get auth headers for Core API requests
   */
  protected async getAuthHeaders(): Promise<Record<string, string>> {
    return {
      Authorization: `Bearer ${await authStore.getToken()}`,
    }
  }

  /**
   * Get a query builder for the configured relation
   * (PostgREST method)
   */
  public from(): PostgrestQueryBuilder<any, any, any> {
    return super.from(this.relation)
  }

  /**
   * Extract the first item from a query response
   * (PostgREST helper method)
   *
   * @param res - Response from a PostgREST query
   * @param schema - Optional schema for parsing the item
   * @returns Parsed first item
   */
  public first<T>(
    res: { data: any[] | null },
    schema?: { parse<T>(input: unknown): T }
  ): T extends undefined ? (DT extends undefined ? void : DT) : T {
    const sc = schema || this.defSchema
    const item = res.data![0]
    return sc ? sc.parse(item) : item
  }

  /**
   * Make a request to the Core API
   * (Custom endpoint method - consolidated from CoreAPIClient)
   *
   * @param options Request options
   * @returns Parsed response data
   * @throws APIError if the request fails
   */
  public async request<T = DT>(options: {
    method: string
    path: string
    body?: any
    query?: Record<string, any>
    resBodySchema?: { parse<T>(input: unknown): T }
  }): Promise<T extends undefined ? (DT extends undefined ? void : DT) : T> {
    const { method, path, body, query, resBodySchema } = options
    const url = new URL(`${this.coreBaseURL}${path}`)

    const config: RequestInit = {
      method,
      headers: {
        ...(await this.getAuthHeaders()),
      },
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
        config.headers = {
          'Content-Type': 'application/json',
          ...config.headers,
        }
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
          if (responseData.message) {
            errorMessage = responseData.message
          } else if (responseData.error) {
            errorMessage = responseData.error
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
              headers: { ...(await this.getAuthHeaders()) },
            })

            if (retryResponse.ok) {
              const retryData = await retryResponse.json()
              const schema = resBodySchema || this.defSchema
              return schema ? schema.parse(retryData) : retryData
            }
          } catch (retryError) {
            console.warn('[DBAPIClient] Token refresh and retry failed:', retryError)
          }
        }

        throw new APIError(errorMessage, response.status, responseData)
      }

      const responseData = await response.json()
      const schema = resBodySchema || this.defSchema
      return schema ? schema.parse(responseData) : responseData
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError(error instanceof Error ? error.message : 'Network error', 0)
    }
  }

  /**
   * Convenience method for GET requests to Core API
   */
  public async get<T = DT>(
    path: string,
    query?: Record<string, any>,
    resBodySchema?: { parse<T>(input: unknown): T }
  ): Promise<T extends undefined ? (DT extends undefined ? void : DT) : T> {
    return this.request<T>({ method: 'GET', path, query, resBodySchema })
  }

  /**
   * Convenience method for POST requests to Core API
   */
  public async post<T = DT>(
    path: string,
    body?: any,
    resBodySchema?: { parse<T>(input: unknown): T }
  ): Promise<T extends undefined ? (DT extends undefined ? void : DT) : T> {
    return this.request<T>({ method: 'POST', path, body, resBodySchema })
  }

  /**
   * Convenience method for PUT requests to Core API
   */
  public async put<T = DT>(
    path: string,
    body?: any,
    resBodySchema?: { parse<T>(input: unknown): T }
  ): Promise<T extends undefined ? (DT extends undefined ? void : DT) : T> {
    return this.request<T>({ method: 'PUT', path, body, resBodySchema })
  }

  /**
   * Convenience method for PATCH requests to Core API
   */
  public async patch<T = DT>(
    path: string,
    body?: any,
    resBodySchema?: { parse<T>(input: unknown): T }
  ): Promise<T extends undefined ? (DT extends undefined ? void : DT) : T> {
    return this.request<T>({ method: 'PATCH', path, body, resBodySchema })
  }

  /**
   * Convenience method for DELETE requests to Core API
   */
  public async delete<T = DT>(
    path: string,
    resBodySchema?: { parse<T>(input: unknown): T }
  ): Promise<T extends undefined ? (DT extends undefined ? void : DT) : T> {
    return this.request<T>({ method: 'DELETE', path, resBodySchema })
  }
}

/**
 * @deprecated Use DBAPIClient instead. CoreAPIClient has been consolidated into DBAPIClient.
 */
export const CoreAPIClient = DBAPIClient

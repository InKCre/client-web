import { z } from 'zod'
import { CONFIG } from '../config'

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

export interface AuthStore {
  refreshToken(): Promise<string>
  getToken(): string | null
}

export class BaseAPIClient {
  protected baseURL: string
  protected authStore?: AuthStore

  constructor(baseURL: string, authStore?: AuthStore) {
    this.baseURL = baseURL
    this.authStore = authStore
  }

  protected async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.authStore) {
      let token = this.authStore.getToken()
      
      // If no token, try to refresh
      if (!token) {
        try {
          token = await this.authStore.refreshToken()
        } catch (error) {
          console.warn('Failed to refresh token:', error)
        }
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  protected async request<T>(
    method: string,
    path: string,
    data?: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${this.baseURL}${path}`
    const headers = await this.getAuthHeaders()

    const config: RequestInit = {
      method,
      headers,
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data)
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

        // If unauthorized and we have auth store, try to refresh token and retry once
        if (response.status === 401 && this.authStore) {
          try {
            await this.authStore.refreshToken()
            const newHeaders = await this.getAuthHeaders()
            const retryResponse = await fetch(url, {
              ...config,
              headers: newHeaders,
            })

            if (retryResponse.ok) {
              const retryData = await retryResponse.json()
              return schema ? schema.parse(retryData) : retryData
            }
          } catch (retryError) {
            console.warn('Token refresh and retry failed:', retryError)
          }
        }

        throw new APIError(errorMessage, response.status, responseData)
      }

      const responseData = await response.json()
      return schema ? schema.parse(responseData) : responseData
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError(
        error instanceof Error ? error.message : 'Network error',
        0
      )
    }
  }

  async get<T>(path: string, schema?: z.ZodSchema<T>): Promise<T> {
    return this.request('GET', path, undefined, schema)
  }

  async post<T>(path: string, data?: any, schema?: z.ZodSchema<T>): Promise<T> {
    return this.request('POST', path, data, schema)
  }

  async put<T>(path: string, data?: any, schema?: z.ZodSchema<T>): Promise<T> {
    return this.request('PUT', path, data, schema)
  }

  async patch<T>(path: string, data?: any, schema?: z.ZodSchema<T>): Promise<T> {
    return this.request('PATCH', path, data, schema)
  }

  async delete<T>(path: string, schema?: z.ZodSchema<T>): Promise<T> {
    return this.request('DELETE', path, undefined, schema)
  }
}

/**
 * PostgREST API Client for database operations
 */
export class DBAPIClient extends BaseAPIClient {
  constructor(authStore?: AuthStore) {
    super(CONFIG.INKCRE_PGREST_URL, authStore)
  }

  /**
   * Build PostgREST query parameters
   */
  protected buildParams(options: {
    select?: string[]
    filter?: Record<string, any>
    order?: string
    limit?: number
    offset?: number
  } = {}): string {
    const params = new URLSearchParams()

    if (options.select?.length) {
      params.append('select', options.select.join(','))
    }

    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, `eq.${value}`)
        }
      })
    }

    if (options.order) {
      params.append('order', options.order)
    }

    if (options.limit) {
      params.append('limit', options.limit.toString())
    }

    if (options.offset) {
      params.append('offset', options.offset.toString())
    }

    return params.toString() ? `?${params.toString()}` : ''
  }

  /**
   * Get records from a table with optional query parameters
   */
  async getRecords<T>(
    table: string,
    options: {
      select?: string[]
      filter?: Record<string, any>
      order?: string
      limit?: number
      offset?: number
    } = {},
    schema?: z.ZodSchema<T[]>
  ): Promise<T[]> {
    const params = this.buildParams(options)
    return this.get(`/${table}${params}`, schema)
  }

  /**
   * Get a single record by ID
   */
  async getRecord<T>(
    table: string,
    id: number | string,
    options: { select?: string[] } = {},
    schema?: z.ZodSchema<T>
  ): Promise<T | null> {
    const params = this.buildParams({
      ...options,
      filter: { id },
    })
    const results = await this.get<T[]>(`/${table}${params}`)
    return results[0] || null
  }

  /**
   * Create a new record
   */
  async createRecord<T>(
    table: string,
    data: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const headers = await this.getAuthHeaders()
    headers['Prefer'] = 'return=representation'
    
    const response = await fetch(`${this.baseURL}/${table}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new APIError(
        errorData.message || `Failed to create ${table}`,
        response.status,
        errorData
      )
    }

    const result = await response.json()
    return schema ? schema.parse(result[0] || result) : result[0] || result
  }

  /**
   * Update a record by ID
   */
  async updateRecord<T>(
    table: string,
    id: number | string,
    data: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const headers = await this.getAuthHeaders()
    headers['Prefer'] = 'return=representation'
    
    const response = await fetch(`${this.baseURL}/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new APIError(
        errorData.message || `Failed to update ${table}`,
        response.status,
        errorData
      )
    }

    const result = await response.json()
    return schema ? schema.parse(result[0] || result) : result[0] || result
  }

  /**
   * Delete a record by ID
   */
  async deleteRecord(table: string, id: number | string): Promise<void> {
    const response = await fetch(`${this.baseURL}/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new APIError(
        errorData.message || `Failed to delete ${table}`,
        response.status,
        errorData
      )
    }
  }
}

/**
 * Core API Client for complex operations
 */
export class CoreAPIClient extends BaseAPIClient {
  constructor(authStore?: AuthStore) {
    super(CONFIG.INKCRE_CORE_URL, authStore)
  }

  /**
   * Search blocks using embedding
   */
  async searchBlocks(
    query: string,
    options: { limit?: number } = {},
    schema?: z.ZodSchema<any>
  ): Promise<any> {
    return this.post('/search/blocks', { query, ...options }, schema)
  }

  /**
   * Get related blocks through graph traversal
   */
  async getRelatedBlocks(
    blockId: number,
    options: { depth?: number; limit?: number } = {},
    schema?: z.ZodSchema<any>
  ): Promise<any> {
    return this.get(`/graph/blocks/${blockId}/related?${new URLSearchParams({
      depth: (options.depth || 1).toString(),
      limit: (options.limit || 10).toString(),
    })}`, schema)
  }

  /**
   * Generate embedding for content
   */
  async generateEmbedding(content: string): Promise<number[]> {
    const result = await this.post<{ embedding: number[] }>('/embeddings/generate', { content })
    return result.embedding
  }
}
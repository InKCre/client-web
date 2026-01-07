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
 * Database API Client - Pure PostgREST wrapper for database operations.
 *
 * This client provides:
 * - PostgREST methods (`.from()`, `.rpc()`) for database operations
 * - Automatic authentication via authStore
 * - Reactive config updates via configStore
 *
 * For Core API requests (HTTP endpoints), use the Client active record instead.
 *
 * @template DT - Data type for the records in the specified relation
 */
export class DBAPIClient<DT = any> extends PostgrestClient {
  protected configStore = sharedConfigStore

  /**
   * @param relation - Database relation (table) name for PostgREST operations
   * @param defSchema - Optional default schema for parsing responses
   * @param schemaName - PostgreSQL schema name (default: "public")
   * @param baseUrl - Base URL of the PostgREST API (default: from CONFIG)
   */
  constructor(
    protected relation: string,
    protected defSchema?: { parse<DT>(input: unknown): DT },
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

    // If no baseUrl provided, use configStore and watch for changes
    if (!baseUrl) {
      watch(
        () => this.configStore.clientConfig.INKCRE_PGREST_URL,
        (newVal) => {
          this.url = newVal
        },
        { immediate: true }
      )
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
}

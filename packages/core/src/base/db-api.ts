import { configStore as sharedConfigStore } from '../config'
import { authStore } from '../auth'
import { PostgrestClient } from '@supabase/postgrest-js'
import { watch } from 'vue'
import type { Database, InkcreSchema, RelationName, RelationRow } from '../database'

type RelationInsert<Relation extends RelationName> = InkcreSchema['Tables'][Relation]['Insert']
type RelationUpdate<Relation extends RelationName> = InkcreSchema['Tables'][Relation]['Update']
export type DatabaseTokenProvider = () => Promise<string>

function encodeTransportValue<Value>(value: unknown): Value {
  const encoded = JSON.stringify(value)
  if (encoded === undefined) {
    throw new TypeError('Database write value must be JSON serializable.')
  }
  return JSON.parse(encoded) as Value
}

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
export class DBAPIClient<
  Relation extends RelationName,
  DT = RelationRow<Relation>,
> extends PostgrestClient<Database, {}, 'inkcre'> {
  protected configStore = sharedConfigStore

  /**
   * @param relation - Database relation (table) name for PostgREST operations
   * @param defSchema - Optional default schema for parsing responses
   * @param schemaName - PostgreSQL schema name (default: "public")
   * @param baseUrl - Base URL of the PostgREST API (default: from CONFIG)
   */
  constructor(
    protected relation: Relation,
    protected defSchema?: { parse(input: unknown): DT },
    public schemaName: 'inkcre' = 'inkcre',
    baseUrl: string = '',
    tokenProvider: DatabaseTokenProvider = () => authStore.getToken()
  ) {
    super(baseUrl, {
      schema: schemaName,
      // Custom fetch to dynamically inject auth token on each request
      fetch: async (input, init) => {
        const token = await tokenProvider()
        const headers = new Headers(init?.headers)
        headers.set('Authorization', `Bearer ${token}`)
        return fetch(input, { ...init, headers })
      },
    })

    // If no baseUrl provided, use configStore and watch for changes
    if (!baseUrl) {
      watch(
        () => this.configStore.metaConfig.INKCRE_PGREST_URL,
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
  public from() {
    return super.from(this.relation)
  }

  public insert(value: unknown) {
    type Insert = RelationInsert<Relation>
    const query = super.from(this.relation)
    const insert = query.insert.bind(query) as unknown as (
      transportValue: Insert | Insert[]
    ) => ReturnType<typeof query.insert>
    return insert(encodeTransportValue<Insert | Insert[]>(value))
  }

  public update(value: unknown) {
    type Update = RelationUpdate<Relation>
    const query = super.from(this.relation)
    const update = query.update.bind(query) as unknown as (
      transportValue: Update
    ) => ReturnType<typeof query.update>
    return update(encodeTransportValue<Update>(value))
  }

  public upsert(value: unknown) {
    type Insert = RelationInsert<Relation>
    const query = super.from(this.relation)
    const upsert = query.upsert.bind(query) as unknown as (
      transportValue: Insert | Insert[]
    ) => ReturnType<typeof query.upsert>
    return upsert(encodeTransportValue<Insert | Insert[]>(value))
  }

  /**
   * Extract the first item from a query response
   * (PostgREST helper method)
   *
   * @param res - Response from a PostgREST query
   * @param schema - Optional schema for parsing the item
   * @returns Parsed first item
   */
  public first<T = DT>(res: { data: unknown[] | null }, schema?: { parse(input: unknown): T }): T {
    const item = res.data?.[0]
    if (item === undefined) {
      throw new APIError(`Relation ${this.relation} returned no rows.`, 404)
    }
    if (schema) return schema.parse(item)
    if (this.defSchema) return this.defSchema.parse(item) as unknown as T
    return item as T
  }
}

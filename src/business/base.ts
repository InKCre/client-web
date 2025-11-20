import { z, type ZodSchema } from 'zod'
import { PostgrestQueryBuilder } from '@supabase/postgrest-js'
import { CONFIG } from '../config'
import { useAuthStore } from '@/stores/auth'
import stores from '@/stores'
import type { ZodClass } from 'zod-class'

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

export class CoreAPIClient<DT = any> {
    protected baseURL: string
    static authStore = useAuthStore(stores)

    /**
     * 
     * @param pathPrefix format `/...`
     */
    constructor(
        protected pathPrefix: string = '',
        protected defResBodySchema?: { parse<DT>(input: unknown): DT }
    ) {
        this.baseURL = `${CONFIG.INKCRE_CORE_URL}${pathPrefix}`
    }

    protected getAuthHeaders(): object {
        return {
            'Authorization': `Bearer ${CoreAPIClient.authStore.getToken()}`
        }
    }

    protected async requestHttp<T>(
        method: string,
        path: string,
        body?: any,
        resBodySchema?: { parse<T>(input: unknown): T }
    ): Promise<T extends undefined ? (DT extends undefined ? void : DT) : T> {
        const url = `${this.baseURL}${path}`

        const config: RequestInit = {
            method,
            headers: {
                ...this.getAuthHeaders()
            },
        }

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(body)
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

                // If unauthorized, try new token and retry once
                if (response.status === 401) {
                    try {
                        const retryResponse = await fetch(url, {
                            ...config,
                            headers: { ...this.getAuthHeaders() },
                        })

                        if (retryResponse.ok) {
                            const retryData = await retryResponse.json()
                            const schema = resBodySchema || this.defResBodySchema
                            return schema ? schema.parse(retryData) : retryData
                        }
                    } catch (retryError) {
                        console.warn('Token refresh and retry failed:', retryError)
                    }
                }

                throw new APIError(errorMessage, response.status, responseData)
            }

            const responseData = await response.json()
            const schema = resBodySchema || this.defResBodySchema
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
}

/**
 * PostgREST API Client for database operations using @supabase/postgrest-js
 */
export class DBAPIClient<SchemaType = any> extends PostgrestQueryBuilder<any, any, any> {
    static authStore = useAuthStore(stores)

    constructor(
        protected relation: string,
        protected defSchema?: { parse(input: unknown): SchemaType },
        protected schemaName: string = 'public',
        protected baseUrl: string = CONFIG.INKCRE_PGREST_URL,
    ) {
        super(new URL(`${baseUrl}/${relation}`), {
            headers: new Headers({
                'Authorization': `Bearer ${DBAPIClient.authStore.getToken()}`,
            }),
            schema: schemaName,
            fetch,
        })
    }

    /**
     * Parse a single item using the default schema if provided
     */
    parseSingle(data: any): SchemaType {
        if (this.defSchema && data) {
            return this.defSchema.parse(data)
        }
        return data
    }

    /**
     * Parse an array of items using the default schema if provided
     */
    parseArray(data: any[]): SchemaType[] {
        if (this.defSchema && data) {
            return data.map(item => this.defSchema!.parse(item))
        }
        return data
    }

}

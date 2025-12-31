import { CONFIG } from "../config";
import { useAuthStore } from "@/stores/auth";
import stores from "@/stores";
import { PostgrestClient, PostgrestQueryBuilder } from "@supabase/postgrest-js";

export class APIError extends Error {
  constructor(message: string, public status: number, public response?: any) {
    super(message);
    this.name = "APIError";
  }
}

export class CoreAPIClient<DT = any> {
  protected baseURL: string;
  static authStore = useAuthStore(stores);

  /**
   *
   * @param pathPrefix format `/...`
   */
  constructor(
    protected pathPrefix: string = "",
    protected defResBodySchema?: { parse<DT>(input: unknown): DT }
  ) {
    this.baseURL = `${CONFIG.INKCRE_CORE_URL}${pathPrefix}`;
  }

  protected async getAuthHeaders(): Promise<object> {
    return {
      Authorization: `Bearer ${await CoreAPIClient.authStore.getToken()}`,
    };
  }

  // TODO should return APIResponse { status, data, headers, ... }, data is instance of Data which holds raw and parsed data
  public async request<T = DT>(options: {
    method: string;
    path: string;
    body?: any;
    query?: Record<string, any>;
    resBodySchema?: { parse<T>(input: unknown): T };
  }): Promise<T extends undefined ? (DT extends undefined ? void : DT) : T> {
    const { method, path, body, query, resBodySchema } = options;
    const url = new URL(`${this.baseURL}${path}`);

    const config: RequestInit = {
      method,
      headers: {
        ...(await this.getAuthHeaders()),
      },
    };

    if (body !== undefined) {
      if (
        typeof body === "object" &&
        body !== null &&
        !(body instanceof FormData) &&
        !(body instanceof Blob) &&
        !(body instanceof ArrayBuffer)
      ) {
        // JSON
        config.body = JSON.stringify(body);
        config.headers = {
          "Content-Type": "application/json",
          ...config.headers,
        };
      } else {
        // FormData / Blob / string / ArrayBuffer
        config.body = body;
      }
    }
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let responseData;

        try {
          responseData = await response.json();
          if (responseData.message) {
            errorMessage = responseData.message;
          } else if (responseData.error) {
            errorMessage = responseData.error;
          }
        } catch {
          // If response is not JSON, use status text
        }

        // If unauthorized, try new token and retry once
        if (response.status === 401) {
          try {
            const retryResponse = await fetch(url, {
              ...config,
              headers: { ...(await this.getAuthHeaders()) },
            });

            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              const schema = resBodySchema || this.defResBodySchema;
              return schema ? schema.parse(retryData) : retryData;
            }
          } catch (retryError) {
            console.warn("Token refresh and retry failed:", retryError);
          }
        }

        throw new APIError(errorMessage, response.status, responseData);
      }

      const responseData = await response.json();
      const schema = resBodySchema || this.defResBodySchema;
      return schema ? schema.parse(responseData) : responseData;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        error instanceof Error ? error.message : "Network error",
        0
      );
    }
  }
}

/**
 * PostgREST API Client for database operations
 */
export class DBAPIClient<DT = any> extends PostgrestClient {
  static authStore = useAuthStore(stores);

  constructor(
    protected relation: string,
    protected defSchema?: { parse<DT>(input: unknown): DT },
    public schemaName: "public" = "public",
    protected baseUrl?: string
  ) {
    baseUrl = baseUrl || CONFIG.INKCRE_PGREST_URL;
    super(baseUrl, {
      headers: new Headers({
        // Authorization will be set later
      }),
      schema: schemaName,
      fetch,
    });

    DBAPIClient.authStore.getToken().then((token) => {
      this.headers.set("Authorization", `Bearer ${token}`);
    });
  }

  public from(): PostgrestQueryBuilder<any, any, any> {
    return super.from(this.relation);
  }

  public first<T>(
    res: { data: any[] | null },
    schema?: { parse<T>(input: unknown): T }
  ): T extends undefined ? (DT extends undefined ? void : DT) : T {
    const sc = schema || this.defSchema;
    const item = res.data![0];
    return sc ? sc.parse(item) : item;
  }
}

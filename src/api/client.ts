import { z } from "zod";
import { getApiBaseUrl, API_CONFIG } from "./config";

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(message: string, public status?: number, public response?: Response) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 数据验证错误类
 */
export class ValidationError extends Error {
  constructor(message: string, public zodError: z.ZodError) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * HTTP客户端基础类
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || getApiBaseUrl()).replace(/\/$/, ""); // 移除末尾斜杠
  }

  /**
   * 执行HTTP请求
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new ApiError(`HTTP error! status: ${response.status}`, response.status, response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("API request failed:", error);
      throw new ApiError("Network or parsing error occurred", undefined, undefined);
    }
  }

  /**
   * 执行HTTP请求并使用 zod 验证响应
   */
  private async requestWithValidation<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await this.request(endpoint, options);

    try {
      return schema.parse(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Response validation failed", error);
      }
      throw error;
    }
  }

  /**
   * GET请求
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.request<T>(url, { method: "GET" });
  }

  /**
   * GET请求（带验证）
   */
  async getWithValidation<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    params?: Record<string, any>,
  ): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.requestWithValidation<T>(url, schema, { method: "GET" });
  }

  /**
   * POST请求
   */
  async post<T>(endpoint: string, data?: any, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.request<T>(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * POST请求（带验证）
   */
  async postWithValidation<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    data?: any,
    params?: Record<string, any>,
  ): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    return this.requestWithValidation<T>(url, schema, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH请求
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH请求（带验证）
   */
  async patchWithValidation<T>(endpoint: string, schema: z.ZodType<T>, data?: any): Promise<T> {
    return this.requestWithValidation<T>(endpoint, schema, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE请求
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  /**
   * DELETE请求（带验证）
   */
  async deleteWithValidation<T>(endpoint: string, schema: z.ZodType<T>): Promise<T> {
    return this.requestWithValidation<T>(endpoint, schema, { method: "DELETE" });
  }
}

// 创建默认客户端实例
export const apiClient = new ApiClient();

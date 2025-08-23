import { getApiBaseUrl, API_CONFIG } from './config'

/**
 * HTTP客户端基础类
 */
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || getApiBaseUrl()).replace(/\/$/, '') // 移除末尾斜杠
  }

  /**
   * 执行HTTP请求
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  /**
   * GET请求
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`
      }
    }

    return this.request<T>(url, { method: 'GET' })
  }

  /**
   * POST请求
   */
  async post<T>(endpoint: string, data?: any, params?: Record<string, any>): Promise<T> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`
      }
    }

    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH请求
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE请求
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// 创建默认客户端实例
export const apiClient = new ApiClient()

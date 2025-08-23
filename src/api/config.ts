/**
 * API配置
 */
export const API_CONFIG = {
  // 开发环境API地址
  DEV_BASE_URL: 'http://localhost:8000',

  // 生产环境API地址
  PROD_BASE_URL: 'https://api.inkcre.com',

  // 获取当前环境的API地址
  get BASE_URL() {
    return import.meta.env.DEV ? this.DEV_BASE_URL : this.PROD_BASE_URL
  },

  // 请求超时时间（毫秒）
  TIMEOUT: 10000,

  // 默认分页大小
  DEFAULT_PAGE_SIZE: 10,
}

/**
 * 从环境变量或配置中获取API基础URL
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || API_CONFIG.BASE_URL
}

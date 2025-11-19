import { reactive } from 'vue'

/**
 * API配置
 */
export const API_CONFIG = reactive({
  // 动态覆盖的API地址
  OVERRIDE_BASE_URL: '',

  // 获取当前环境的API地址
  get BASE_URL() {
    if (this.OVERRIDE_BASE_URL) return this.OVERRIDE_BASE_URL
    return import.meta.env.DEV ? 'http://localhost:8000' : 'https://api.inkcre.com'
  },

  // 请求超时时间（毫秒）
  TIMEOUT: 10000,

  // 默认分页大小
  DEFAULT_PAGE_SIZE: 10,
})

export const MF_CONFIG = reactive({
  INKCRE_TWITTER_URL: 'http://localhost:5174/remoteEntry.js'
})

/**
 * 初始化应用配置
 */
export async function initAppConfig() {
  if (import.meta.env.VITE_DEPLOY_TO === 'CLOUDFLARE') {
    try {
      const res = await fetch('/api/cf-env-vars')
      if (res.ok) {
        const env = await res.json()
        if (env.API_BASE_URL) {
          API_CONFIG.OVERRIDE_BASE_URL = env.API_BASE_URL
        }
        if (env.MF_URL) {
          MF_CONFIG.INKCRE_TWITTER_URL = env.MF_URL
        }
      }
    } catch (e) {
      console.error('Failed to load CF env vars', e)
    }
  }
}

/**
 * 从环境变量或配置中获取API基础URL
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || API_CONFIG.BASE_URL
}

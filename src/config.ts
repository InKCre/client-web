import { reactive, watch } from 'vue'
import { z } from 'zod'

/**
 * 配置 Schema
 */
const ConfigSchema = z.object({
  INKCRE_CORE_URL: z.string().url(),
  INKCRE_PGREST_URL: z.string().url(),
  INKCRE_JWT_SECRET: z.string().min(1),
  LOCAL_CLIENT_ID: z.string().uuid().nullable(),
})

type ConfigType = z.infer<typeof ConfigSchema>

const CONFIG_STORAGE_KEY = 'inkcre_app_config'

/**
 * 从 localStorage 加载配置
 */
function loadConfigFromStorage(): Partial<ConfigType> {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      console.log('[Config] 从 localStorage 加载配置')
      return parsed
    }
  } catch (error) {
    console.error('[Config] 加载配置失败:', error)
  }
  return {}
}

/**
 * 保存配置到 localStorage
 */
function saveConfigToStorage(config: Partial<ConfigType>) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
    console.log('[Config] 配置已保存到 localStorage')
  } catch (error) {
    console.error('[Config] 保存配置失败:', error)
  }
}

// 初始化配置对象
export const CONFIG = reactive<ConfigType>({
  INKCRE_CORE_URL: "",
  INKCRE_PGREST_URL: "",
  INKCRE_JWT_SECRET: "",
  LOCAL_CLIENT_ID: null,
})

// 从 localStorage 加载配置
const storedConfig = loadConfigFromStorage()
Object.assign(CONFIG, storedConfig)

// 从环境变量加载配置
if (import.meta.env.VITE_DEPLOY_TO === 'CLOUDFLARE') {
  try {
    const res = await fetch('/api/cf-env-vars')
    if (res.ok) {
      const env = await res.json()
      CONFIG.INKCRE_CORE_URL = CONFIG.INKCRE_CORE_URL || env.INKCRE_CORE_URL
      CONFIG.INKCRE_PGREST_URL = CONFIG.INKCRE_PGREST_URL || env.INKCRE_PGREST_URL
      CONFIG.INKCRE_JWT_SECRET = CONFIG.INKCRE_JWT_SECRET || env.INKCRE_JWT_SECRET
    }
  } catch (e) {
    console.error('Failed to load CF env vars', e)
  }
} else {
  CONFIG.INKCRE_CORE_URL = CONFIG.INKCRE_CORE_URL || import.meta.env.VITE_INKCRE_CORE_URL || ""
  CONFIG.INKCRE_PGREST_URL = CONFIG.INKCRE_PGREST_URL || import.meta.env.VITE_INKCRE_PGREST_URL || ""
  CONFIG.INKCRE_JWT_SECRET = CONFIG.INKCRE_JWT_SECRET || import.meta.env.VITE_INKCRE_JWT_SECRET || ""
}

// 监听配置变化并自动保存到 localStorage
watch(CONFIG, (newConfig) => {
  saveConfigToStorage(newConfig)
}, { deep: true })

/**
 * 配置管理工具函数
 */
export const configUtils = {
  /**
   * 获取本地客户端 ID
   */
  getLocalClientId(): string | null {
    return CONFIG.LOCAL_CLIENT_ID
  },

  /**
   * 设置本地客户端 ID
   */
  setLocalClientId(clientId: string | null) {
    CONFIG.LOCAL_CLIENT_ID = clientId
  },

  /**
   * 检查指定的客户端 ID 是否为本地客户端
   */
  isLocalClient(clientId: string): boolean {
    return CONFIG.LOCAL_CLIENT_ID === clientId
  },

  /**
   * 重置配置
   */
  reset() {
    CONFIG.INKCRE_CORE_URL = ""
    CONFIG.INKCRE_PGREST_URL = ""
    CONFIG.INKCRE_JWT_SECRET = ""
    CONFIG.LOCAL_CLIENT_ID = null
    localStorage.removeItem(CONFIG_STORAGE_KEY)
  },

  /**
   * 导出配置（用于备份）
   */
  export(): string {
    return JSON.stringify(CONFIG, null, 2)
  },

  /**
   * 导入配置（用于恢复）
   */
  import(configJson: string) {
    try {
      const parsed = JSON.parse(configJson)
      const validated = ConfigSchema.parse(parsed)
      Object.assign(CONFIG, validated)
      console.log('[Config] 配置导入成功')
    } catch (error) {
      console.error('[Config] 配置导入失败:', error)
      throw new Error('无效的配置格式')
    }
  },
}

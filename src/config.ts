import { reactive } from 'vue'

export const CONFIG = reactive({
  INKCRE_CORE_URL: "",
  INKCRE_PGREST_URL: "",
  INKCRE_JWT_SECRET: "",
})

if (import.meta.env.VITE_DEPLOY_TO === 'CLOUDFLARE') {
  try {
    const res = await fetch('/api/cf-env-vars')
    if (res.ok) {
      const env = await res.json()
      CONFIG.INKCRE_CORE_URL = env.INKCRE_CORE_URL
      CONFIG.INKCRE_PGREST_URL = env.INKCRE_PGREST_URL
      CONFIG.INKCRE_JWT_SECRET = env.INKCRE_JWT_SECRET
    }
  } catch (e) {
    console.error('Failed to load CF env vars', e)
  }
}
else {
  CONFIG.INKCRE_CORE_URL = import.meta.env.VITE_INKCRE_CORE_URL
  CONFIG.INKCRE_PGREST_URL = import.meta.env.VITE_INKCRE_PGREST_URL
  CONFIG.INKCRE_JWT_SECRET = import.meta.env.VITE_INKCRE_JWT_SECRET
}

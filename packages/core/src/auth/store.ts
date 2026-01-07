import { ref, watch } from 'vue'
import { SignJWT } from 'jose'
import { configStore } from '../config'

/**
 * Create an auth store instance.
 * Returns reactive token and token management functions.
 */
export function createAuthStore(configStoreIns = configStore) {
  const token = ref<string | undefined>(undefined)

  async function newToken(): Promise<string> {
    if (!configStoreIns.metaConfig.INKCRE_JWT_SECRET) {
      throw new Error('JWT_SECRET not configured')
    }

    try {
      const secret = new TextEncoder().encode(configStoreIns.metaConfig.INKCRE_JWT_SECRET)
      const signedToken = await new SignJWT({
        role: 'authenticated',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .setIssuer('inkcre-client')
        .setAudience('inkcre-client')
        .sign(secret)

      token.value = signedToken
      return signedToken
    } catch (error) {
      console.error('[Auth] Failed to sign a new token:', error)
      throw new Error('Failed to sign a new token')
    }
  }

  async function getToken(): Promise<string> {
    if (!token.value) {
      return await newToken()
    }
    return token.value
  }

  async function refreshToken(): Promise<string> {
    return await newToken()
  }

  // Watch for JWT secret changes and regenerate token
  watch(
    () => configStoreIns.metaConfig.INKCRE_JWT_SECRET,
    async (newSecret) => {
      if (newSecret) {
        try {
          await newToken()
        } catch (error) {
          console.error('[Auth] Failed to generate token on secret change:', error)
        }
      } else {
        token.value = undefined
      }
    },
    { immediate: true }
  )

  return {
    token,
    newToken,
    getToken,
    refreshToken,
  }
}

/**
 * Global auth store singleton.
 * All applications share this instance for authentication.
 */
export const authStore = createAuthStore()

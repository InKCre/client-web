import { defineStore } from 'pinia'
import jwt from 'jsonwebtoken'
import { CONFIG } from '../config'
import type { AuthStore } from '../business/base'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    isAuthenticated: false,
  }),

  getters: {
    getToken: (state): string | null => state.token,
    isTokenExpired: (state): boolean => {
      if (!state.token) return true
      
      try {
        const decoded = jwt.decode(state.token) as jwt.JwtPayload | null
        if (!decoded || !decoded.exp) return true
        
        // Check if token expires within the next 30 seconds
        const now = Math.floor(Date.now() / 1000)
        return decoded.exp < (now + 30)
      } catch {
        return true
      }
    },
  },

  actions: {
    /**
     * Sign a new JWT token using the JWT secret from config
     */
    async refreshToken(): Promise<string> {
      if (!CONFIG.INKCRE_JWT_SECRET) {
        throw new Error('JWT_SECRET not configured')
      }

      try {
        // Create a new token with 24 hour expiration
        // In a real app, you'd typically call a backend endpoint to get a new token
        // For now, we'll sign it locally using the secret
        const payload = {
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
          // Add any additional claims here
          sub: 'user', // subject
        }

        const token = jwt.sign(payload, CONFIG.INKCRE_JWT_SECRET)
        
        this.setToken(token)
        return token
      } catch (error) {
        console.error('Failed to refresh token:', error)
        throw new Error('Failed to refresh authentication token')
      }
    },

    /**
     * Set the current token
     */
    setToken(token: string | null) {
      this.token = token
      this.isAuthenticated = !!token && !this.isTokenExpired
    },

    /**
     * Clear the current token
     */
    logout() {
      this.token = null
      this.isAuthenticated = false
    },

    /**
     * Initialize auth state (e.g., from localStorage)
     */
    initialize() {
      // In a real app, you might want to load token from localStorage
      // For now, we'll start with no token and let it be refreshed as needed
      const savedToken = localStorage.getItem('inkcre_auth_token')
      if (savedToken) {
        this.setToken(savedToken)
        
        // If token is expired, clear it
        if (this.isTokenExpired) {
          this.logout()
          localStorage.removeItem('inkcre_auth_token')
        }
      }
    },

    /**
     * Get current token or refresh if needed
     */
    async getValidToken(): Promise<string | null> {
      if (this.token && !this.isTokenExpired) {
        return this.token
      }

      try {
        const newToken = await this.refreshToken()
        // Save to localStorage
        localStorage.setItem('inkcre_auth_token', newToken)
        return newToken
      } catch (error) {
        console.error('Failed to get valid token:', error)
        return null
      }
    },
  },
})

// Create an AuthStore adapter for the API clients
export function createAuthStoreAdapter(authStore: ReturnType<typeof useAuthStore>): AuthStore {
  return {
    async refreshToken(): Promise<string> {
      return await authStore.refreshToken()
    },
    getToken(): string | null {
      return authStore.getToken
    },
  }
}
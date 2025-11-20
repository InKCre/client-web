import { defineStore } from 'pinia'
import jwt from 'jsonwebtoken'
import { CONFIG } from '../config'

interface AuthState {
    token?: string
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        token: undefined
    }),

    getters: {
        getToken: (state): string | undefined => state.token,
    },

    actions: {
        /**
         * Sign a new JWT token using the JWT secret from config
         */
        newToken(): string {
            if (!CONFIG.INKCRE_JWT_SECRET) {
                throw new Error('JWT_SECRET not configured')
            }

            try {
                // Create a new token with 24 hour expiration
                const payload = {
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
                    sub: 'user',
                    iss: 'inkcre-client-web',
                }

                const token = jwt.sign(payload, CONFIG.INKCRE_JWT_SECRET)

                this.token = token
                return this.token
            } catch (error) {
                console.error('Failed to sign a new token:', error)
                throw new Error('Failed to sign a new token')
            }
        },

        getToken(): string {
            if (!this.token) {
                return this.newToken();
            }
            return this.token;
        }
    },
})
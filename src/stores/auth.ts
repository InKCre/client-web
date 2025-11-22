import { defineStore } from "pinia";
import { SignJWT } from "jose";
import { CONFIG } from "../config";

interface AuthState {
  token?: string;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    token: undefined,
  }),

  actions: {
    /**
     * Sign a new JWT token using the JWT secret from config
     */
    async newToken(): Promise<string> {
      if (!CONFIG.INKCRE_JWT_SECRET) {
        throw new Error("JWT_SECRET not configured");
      }

      try {
        // Create a new token with 24 hour expiration

        const secret = new TextEncoder().encode(CONFIG.INKCRE_JWT_SECRET);
        const token = await new SignJWT({
          role: "authenticated",
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("24h")
          .setIssuer("inkcre-client-web")
          .setAudience("inkcre-client-web")
          .sign(secret);

        this.token = token;
        return this.token;
      } catch (error) {
        console.error("Failed to sign a new token:", error);
        throw new Error("Failed to sign a new token");
      }
    },

    async getToken(): Promise<string> {
      if (!this.token) {
        return await this.newToken();
      }
      return this.token;
    },
  },
});

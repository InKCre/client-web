import { defineStore } from "pinia";
import { SignJWT } from "jose";
import { CONFIG } from "../config";
import { ref, computed, watch } from "vue";

export const useAuthStore = defineStore("auth", () => {
  // State
  const token = ref<string | undefined>(undefined);

  // Actions
  async function newToken(): Promise<string> {
    if (!CONFIG.value.INKCRE_JWT_SECRET) {
      throw new Error("JWT_SECRET not configured");
    }

    try {
      const secret = new TextEncoder().encode(CONFIG.value.INKCRE_JWT_SECRET);
      const signedToken = await new SignJWT({
        role: "authenticated",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .setIssuer("inkcre-client-web")
        .setAudience("inkcre-client-web")
        .sign(secret);

      token.value = signedToken;
      return signedToken;
    } catch (error) {
      console.error("Failed to sign a new token:", error);
      throw new Error("Failed to sign a new token");
    }
  }

  async function getToken(): Promise<string> {
    if (!token.value) {
      return await newToken();
    }
    return token.value;
  }

  async function refreshToken(): Promise<string> {
    return await newToken();
  }

  // Watch for JWT secret changes and regenerate token
  watch(
    () => CONFIG.value.INKCRE_JWT_SECRET,
    async (newSecret) => {
      if (newSecret) {
        await newToken();
      } else {
        token.value = undefined;
      }
    },
    { immediate: true }
  );

  return {
    token,
    newToken,
    getToken,
    refreshToken,
  };
});

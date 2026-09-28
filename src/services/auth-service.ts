import { LoginRequest, LoginResponse, RefreshTokenResponse } from "../types";
import { registerTokenRefresher, request } from "./api";
import { authStorage } from "./auth-storage";

let refreshPromise: Promise<string> | null = null;
let sessionExpiredCallback: (() => void) | null = null;
let tokenRefreshedCallback: ((token: string) => void) | null = null;

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      requiresAuth: false,
    });
  },

  async logout(): Promise<void> {
    await request<void>("/auth/logout", {
      method: "POST",
      requiresAuth: true,
    });
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    return await request<RefreshTokenResponse>("/auth/refresh", {
      method: "POST",
      requiresAuth: false,
    });
  },

  async refreshAccessToken(): Promise<string> {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const response = await authService.refreshToken();
        await authStorage.saveToken(response.accessToken);
        tokenRefreshedCallback?.(response.accessToken);
        return response.accessToken;
      } catch (error: any) {
        if (error?.status === 401 || error?.status === 403) {
          await authStorage.clearAuth();
          sessionExpiredCallback?.();
        }
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  onSessionExpired(callback: (() => void) | null): void {
    sessionExpiredCallback = callback;
  },

  onTokenRefreshed(callback: ((token: string) => void) | null): void {
    tokenRefreshedCallback = callback;
  },
};

registerTokenRefresher(() => authService.refreshAccessToken());

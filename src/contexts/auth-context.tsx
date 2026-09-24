import React, { createContext, useState, useEffect, useCallback } from "react";
import { LoginRequest } from "../types";
import { authService, authStorage } from "../services";

export interface AuthContextType {
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    authService.onSessionExpired(() => {
      setAccessToken(null);
    });

    authService.onTokenRefreshed((newToken) => {
      setAccessToken(newToken);
    });

    async function initAuth() {
      try {
        const savedToken = await authStorage.getToken();
        if (savedToken) {
          try {
            const newToken = await authService.refreshAccessToken();
            setAccessToken(newToken);
          } catch (error: any) {
            if (error?.code === "NETWORK_ERROR" || error?.status === 0) {
              setAccessToken(savedToken);
            } else {
              await authStorage.clearAuth();
              setAccessToken(null);
            }
          }
        }
      } catch {
        // ignore storage loading errors
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();

    return () => {
      authService.onSessionExpired(null);
      authService.onTokenRefreshed(null);
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    await authStorage.saveToken(response.accessToken);
    setAccessToken(response.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Idempotent: even if server fails, always wipe local session
    } finally {
      setAccessToken(null);
      await authStorage.clearAuth();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isLoading,
        isAuthenticated: !!accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

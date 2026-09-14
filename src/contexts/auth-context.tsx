import React, { createContext, useState, useEffect, useCallback } from "react";
import { AuthUser, LoginRequest } from "../types";
import { authService, authStorage } from "../services";

export interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const [savedToken, savedUser] = await Promise.all([
          authStorage.getToken(),
          authStorage.getUser(),
        ]);
        if (savedToken && savedUser) {
          setAccessToken(savedToken);
          setUser(savedUser);
        }
      } catch {
        // ignore storage loading errors
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setAccessToken(response.accessToken);
      setUser(response.user);
      await Promise.all([
        authStorage.saveToken(response.accessToken),
        authStorage.saveUser(response.user),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // Idempotent: even if server fails, always wipe local session
    } finally {
      setAccessToken(null);
      setUser(null);
      await authStorage.clearAuth();
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await authService.getMe();
      setUser(updatedUser);
      await authStorage.saveUser(updatedUser);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!accessToken && !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

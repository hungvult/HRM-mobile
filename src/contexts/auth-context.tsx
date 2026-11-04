import React, { createContext, useState, useEffect, useCallback } from "react";
import { LoginRequest } from "../types";
import { authService, authStorage } from "../services";

export interface AuthContextType {
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest, remember?: boolean) => Promise<void>;
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

    // Khởi động chỉ khôi phục phiên còn hợp lệ; logout hoặc login mới sẽ làm mã phiên này hết hiệu lực.
    async function initAuth() {
      const version = authStorage.getSessionVersion();
      try {
        const savedToken = await authStorage.getToken();
        if (savedToken) {
          try {
            const newToken = await authService.refreshAccessToken();
            if (authStorage.isCurrentSession(version)) setAccessToken(newToken);
          } catch (error: any) {
            if (error?.code === "NETWORK_ERROR" || error?.status === 0) {
              if (authStorage.isCurrentSession(version))
                setAccessToken(savedToken);
            } else {
              if (authStorage.isCurrentSession(version)) {
                await authStorage.clearAuth();
                setAccessToken(null);
              }
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

  // AuthService đã lưu token tuần tự; provider chỉ cập nhật UI nếu người dùng chưa kết thúc phiên vừa tạo.
  const login = useCallback(
    async (credentials: LoginRequest, remember = false) => {
      const response = await authService.login(credentials, remember);
      if (authStorage.isCurrentSession(authStorage.getSessionVersion()))
        setAccessToken(response.accessToken);
    },
    [],
  );

  // Đóng màn nghiệp vụ ngay, rồi để service thu hồi phiên; chuyển lỗi cho màn hình thông báo kết quả chưa xác nhận.
  const logout = useCallback(async () => {
    setAccessToken(null);
    try {
      await authService.logout();
    } finally {
      setAccessToken(null);
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

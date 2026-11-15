import { LoginRequest, LoginResponse, RefreshTokenResponse } from "../types";
import { ApiError, registerTokenRefresher, request } from "./api";
import { authStorage } from "./auth-storage";

let refreshPromise: Promise<string> | null = null;
let logoutPromise: Promise<void> | null = null;
let loginPromise: Promise<LoginResponse> | null = null;
let sessionExpiredCallback: (() => void) | null = null;
let tokenRefreshedCallback: ((token: string) => void) | null = null;

// Token có thể thuộc phiên vừa xoay. Gọi hủy trực tiếp, không cho API tự refresh trong lúc đang đăng xuất.
async function revokeToken(token: string | null): Promise<void> {
  await request<void>("/auth/logout", {
    method: "POST",
    requiresAuth: false,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

function endedSession() {
  return new ApiError({
    timestamp: new Date().toISOString(),
    status: 401,
    code: "AUTH_SESSION_ENDED",
    message: "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.",
  });
}

export const authService = {
  // Login chờ logout xong rồi mới mở phiên mới; chỉ lưu phản hồi còn thuộc đúng lượt đăng nhập này.
  login(credentials: LoginRequest): Promise<LoginResponse> {
    if (loginPromise) return loginPromise;
    loginPromise = (async () => {
      // Chỉ nhường lượt khi thực sự còn tác vụ cũ; kiểm tra lại sau mỗi await vì logout có thể bắt đầu trong lúc chờ.
      while (logoutPromise || refreshPromise) {
        await (logoutPromise ?? refreshPromise)?.catch(() => undefined);
      }
      const clearing = authStorage.clearAuth();
      // Lấy revision ngay lúc clearAuth đổi phiên, trước await để không nhận nhầm revision của một lượt khác.
      const version = authStorage.getSessionVersion();
      await clearing;
      if (version !== authStorage.getSessionVersion()) throw endedSession();
      const response = await request<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        requiresAuth: false,
      });
      if (!(await authStorage.saveToken(response.accessToken, version, true))) {
        await revokeToken(response.accessToken);
        throw endedSession();
      }
      return response;
    })().finally(() => {
      loginPromise = null;
    });
    return loginPromise;
  },

  // Chặn phiên ngay, đợi refresh đã gửi rồi hủy đúng token mới. Lỗi server vẫn giữ dấu đăng xuất cục bộ.
  logout(): Promise<void> {
    if (logoutPromise) return logoutPromise;
    const clearedToken = authStorage.beginLogout();
    const pendingRefresh = refreshPromise;
    sessionExpiredCallback?.();
    logoutPromise = (async () => {
      let token = await clearedToken;
      if (pendingRefresh) token = await pendingRefresh.catch(() => token);
      try {
        await revokeToken(token);
      } catch (error: any) {
        if (error?.status !== 401) throw error;
        // Token đã hết hạn hoặc bị xoay: dùng cookie lấy token chỉ để hủy, không lưu hay gọi callback đăng nhập.
        // Refresh 401 cũng có thể do thiếu cookie; báo chưa xác nhận được thay vì tự coi phiên server đã bị hủy.
        const refreshed = await authService.refreshToken();
        await revokeToken(refreshed.accessToken);
      }
    })().finally(async () => {
      try {
        await authStorage.clearAuth();
      } finally {
        logoutPromise = null;
      }
    });
    return logoutPromise;
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    return await request<RefreshTokenResponse>("/auth/refresh", {
      method: "POST",
      requiresAuth: false,
    });
  },

  // Các API dùng chung một refresh. Phản hồi muộn được trả cho luồng logout để hủy, không được cập nhật UI/SecureStore.
  async refreshAccessToken(): Promise<string> {
    const version = authStorage.getSessionVersion();
    if (!authStorage.isCurrentSession(version)) throw endedSession();
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const response = await authService.refreshToken();
        if (await authStorage.saveToken(response.accessToken, version)) {
          if (authStorage.isCurrentSession(version))
            tokenRefreshedCallback?.(response.accessToken);
        } else if (!logoutPromise) {
          // Phiên đã đổi sang tài khoản khác; thu hồi token của phản hồi cũ thay vì để phiên server bị bỏ quên.
          await revokeToken(response.accessToken);
          throw endedSession();
        }
        return response.accessToken;
      } catch (error: any) {
        if (
          authStorage.isCurrentSession(version) &&
          (error?.status === 401 || error?.status === 403)
        ) {
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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const secure = vi.hoisted(() => ({
  values: new Map<string, string>(),
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));
vi.mock("expo-secure-store", () => secure);
vi.mock("@/constants", () => ({
  API_BASE_URL: "https://fixture.invalid/api/v1",
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("Kết thúc phiên Mobile và phản hồi đến muộn", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    secure.values.clear();
    secure.values.set("access_token", "old-fixture-token");
    secure.getItemAsync.mockImplementation(
      async (key: string) => secure.values.get(key) ?? null,
    );
    secure.setItemAsync.mockImplementation(
      async (key: string, value: string) => {
        secure.values.set(key, value);
      },
    );
    secure.deleteItemAsync.mockImplementation(async (key: string) => {
      secure.values.delete(key);
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("refresh đến sau logout chỉ cung cấp token để hủy, không khôi phục SecureStore hoặc callback UI", async () => {
    const refresh = deferred<Response>();
    const started = deferred<void>();
    const revoked: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options: RequestInit) => {
        if (url.endsWith("/refresh")) {
          started.resolve();
          return refresh.promise;
        }
        revoked.push((options.headers as Record<string, string>).Authorization);
        return new Response(null, { status: 204 });
      }),
    );
    const { authService } = await import("@/services/auth-service");
    const updated = vi.fn();
    const expired = vi.fn();
    authService.onTokenRefreshed(updated);
    authService.onSessionExpired(expired);
    const pending = authService.refreshAccessToken();
    await started.promise;
    const logout = authService.logout();
    expect(expired).toHaveBeenCalledOnce();
    refresh.resolve(Response.json({ accessToken: "late-fixture-token" }));
    await Promise.all([pending, logout]);
    expect(revoked).toEqual(["Bearer late-fixture-token"]);
    expect(updated).not.toHaveBeenCalled();
    expect(secure.values.get("access_token")).toBeUndefined();
    expect(secure.values.get("auth_logged_out")).toBe("1");
  });

  it("ghi SecureStore đang chạy kết thúc trước lượt xóa phiên và không phát callback đăng nhập", async () => {
    const writing = deferred<void>();
    const finishWrite = deferred<void>();
    secure.setItemAsync.mockImplementation(
      async (key: string, value: string) => {
        if (key === "access_token") {
          writing.resolve();
          await finishWrite.promise;
        }
        secure.values.set(key, value);
      },
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("/refresh")
          ? Response.json({ accessToken: "in-flight-write" })
          : new Response(null, { status: 204 }),
      ),
    );
    const { authService } = await import("@/services/auth-service");
    const updated = vi.fn();
    authService.onTokenRefreshed(updated);
    const pending = authService.refreshAccessToken();
    await writing.promise;
    const logout = authService.logout();
    finishWrite.resolve();
    await Promise.all([pending, logout]);
    expect(secure.values.has("access_token")).toBe(false);
    expect(updated).not.toHaveBeenCalled();
  });

  it("sau logout API bảo vệ bị chặn và mở lại app vẫn giữ dấu đăng xuất", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    const { authService } = await import("@/services/auth-service");
    const { request } = await import("@/services/api");
    await authService.logout();
    await expect(request("/me/profile")).rejects.toMatchObject({
      code: "AUTH_SESSION_ENDED",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    vi.resetModules();
    const { authStorage } = await import("@/services/auth-storage");
    expect(await authStorage.getToken()).toBeNull();
    expect(authStorage.isCurrentSession(authStorage.getSessionVersion())).toBe(
      false,
    );
  });

  it("mất mạng khi logout vẫn xóa token và báo lỗi cho caller", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("fixture network error");
      }),
    );
    const { authService } = await import("@/services/auth-service");
    await expect(authService.logout()).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
    expect(secure.values.has("access_token")).toBe(false);
    expect(secure.values.get("auth_logged_out")).toBe("1");
  });

  it("hai lượt logout dùng chung một request", async () => {
    const response = deferred<Response>();
    const fetcher = vi.fn(() => response.promise);
    vi.stubGlobal("fetch", fetcher);
    const { authService } = await import("@/services/auth-service");
    const first = authService.logout();
    const second = authService.logout();
    expect(first).toBe(second);
    response.resolve(new Response(null, { status: 204 }));
    await first;
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("token hết hạn được refresh chỉ để hủy phiên, không cập nhật UI", async () => {
    let logouts = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options: RequestInit) => {
        if (url.endsWith("/refresh"))
          return Response.json({ accessToken: "logout-only" });
        logouts++;
        if (logouts === 1)
          return Response.json(
            { status: 401, code: "AUTH_UNAUTHORIZED" },
            { status: 401 },
          );
        expect((options.headers as Record<string, string>).Authorization).toBe(
          "Bearer logout-only",
        );
        return new Response(null, { status: 204 });
      }),
    );
    const { authService } = await import("@/services/auth-service");
    const updated = vi.fn();
    authService.onTokenRefreshed(updated);
    await authService.logout();
    expect(logouts).toBe(2);
    expect(updated).not.toHaveBeenCalled();
    expect(secure.values.has("access_token")).toBe(false);
  });

  it("chỉ login mới thành công được mở lại phiên sau logout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("/login")
          ? Response.json({
              accessToken: "new-login",
              user: { roles: ["EMPLOYEE"] },
            })
          : new Response(null, { status: 204 }),
      ),
    );
    const { authService } = await import("@/services/auth-service");
    const { authStorage } = await import("@/services/auth-storage");
    await authService.logout();
    await authService.login({
      usernameOrEmail: "qa_fixture",
      password: "fixture",
    });
    expect(await authStorage.getToken()).toBe("new-login");
    expect(secure.values.has("auth_logged_out")).toBe(false);
  });

  it("phản hồi của tài khoản cũ không được trả vào màn hình sau login mới", async () => {
    const oldResponse = deferred<Response>();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.endsWith("/login")
          ? Response.json({ accessToken: "second-account" })
          : oldResponse.promise,
      ),
    );
    const { request } = await import("@/services/api");
    const { authService } = await import("@/services/auth-service");
    const pending = request("/me/profile");
    const rejected = expect(pending).rejects.toMatchObject({
      code: "AUTH_SESSION_ENDED",
    });
    await authService.login({ usernameOrEmail: "second", password: "fixture" });
    oldResponse.resolve(Response.json({ private: "old-account" }));
    await rejected;
    expect(secure.values.get("access_token")).toBe("second-account");
  });

  it("login chờ refresh cũ hoàn tất trước khi nhận cookie của phiên mới", async () => {
    const refresh = deferred<Response>();
    const started = deferred<void>();
    const paths: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        paths.push(url);
        if (url.endsWith("/refresh")) {
          started.resolve();
          return refresh.promise;
        }
        return Response.json({ accessToken: "new-login" });
      }),
    );
    const { authService } = await import("@/services/auth-service");
    const pending = authService.refreshAccessToken();
    await started.promise;
    const login = authService.login({
      usernameOrEmail: "new",
      password: "fixture",
    });
    await Promise.resolve();
    expect(paths).toHaveLength(1);
    refresh.resolve(Response.json({ accessToken: "old-refreshed" }));
    await Promise.all([pending, login]);
    expect(paths).toHaveLength(2);
    expect(secure.values.get("access_token")).toBe("new-login");
  });

  it("login đang đợi refresh phải đợi thêm logout phát sinh trong lúc chờ", async () => {
    const refresh = deferred<Response>();
    const refreshStarted = deferred<void>();
    const logoutResponse = deferred<Response>();
    const logoutStarted = deferred<void>();
    const loginCalled = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/refresh")) {
          refreshStarted.resolve();
          return refresh.promise;
        }
        if (url.endsWith("/logout")) {
          logoutStarted.resolve();
          return logoutResponse.promise;
        }
        loginCalled();
        return Response.json({ accessToken: "new-after-logout" });
      }),
    );
    const { authService } = await import("@/services/auth-service");
    const pendingRefresh = authService.refreshAccessToken();
    await refreshStarted.promise;
    const login = authService.login({
      usernameOrEmail: "new",
      password: "fixture",
    });
    const logout = authService.logout();
    refresh.resolve(Response.json({ accessToken: "old-rotated" }));
    await logoutStarted.promise;
    expect(loginCalled).not.toHaveBeenCalled();
    logoutResponse.resolve(new Response(null, { status: 204 }));
    await Promise.all([pendingRefresh, logout, login]);
    expect(secure.values.get("access_token")).toBe("new-after-logout");
    expect(secure.values.has("auth_logged_out")).toBe(false);
  });

  it("hai lượt submit login dùng chung một request và không ghi đè tài khoản bằng phản hồi khác", async () => {
    const response = deferred<Response>();
    const fetcher = vi.fn(() => response.promise);
    vi.stubGlobal("fetch", fetcher);
    const { authService } = await import("@/services/auth-service");
    const first = authService.login({
      usernameOrEmail: "fixture",
      password: "fixture",
    });
    const second = authService.login({
      usernameOrEmail: "fixture",
      password: "fixture",
    });
    expect(first).toBe(second);
    response.resolve(Response.json({ accessToken: "single-login" }));
    await Promise.all([first, second]);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(secure.values.get("access_token")).toBe("single-login");
  });

  it("logout và refresh cùng 401 phải báo chưa xác nhận được, nhưng phiên cục bộ vẫn đóng", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { status: 401, code: "AUTH_UNAUTHORIZED" },
          { status: 401 },
        ),
      ),
    );
    const { authService } = await import("@/services/auth-service");
    await expect(authService.logout()).rejects.toMatchObject({ status: 401 });
    expect(secure.values.has("access_token")).toBe(false);
    expect(secure.values.get("auth_logged_out")).toBe("1");
  });

  it("logout phát sinh ngay sau lúc bắt đầu login phải hủy lượt login cũ trước khi gửi request", async () => {
    const logoutResponse = deferred<Response>();
    const logoutStarted = deferred<void>();
    const loginCalled = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/logout")) {
          logoutStarted.resolve();
          return logoutResponse.promise;
        }
        loginCalled();
        return Response.json({ accessToken: "must-not-be-saved" });
      }),
    );
    const { authService } = await import("@/services/auth-service");
    const login = authService.login({
      usernameOrEmail: "fixture",
      password: "fixture",
    });
    const rejected = expect(login).rejects.toMatchObject({
      code: "AUTH_SESSION_ENDED",
    });
    await Promise.resolve();
    const logout = authService.logout();
    await logoutStarted.promise;
    expect(loginCalled).not.toHaveBeenCalled();
    logoutResponse.resolve(new Response(null, { status: 204 }));
    await Promise.all([rejected, logout]);
    expect(secure.values.has("access_token")).toBe(false);
  });
});

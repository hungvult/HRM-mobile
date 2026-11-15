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

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  secure.values.clear();
  secure.getItemAsync.mockImplementation(
    async (key: string) => secure.values.get(key) ?? null,
  );
  secure.setItemAsync.mockImplementation(async (key: string, value: string) => {
    secure.values.set(key, value);
  });
  secure.deleteItemAsync.mockImplementation(async (key: string) => {
    secure.values.delete(key);
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.endsWith("/logout")
        ? new Response(null, { status: 204 })
        : Response.json({
            accessToken: url.endsWith("/refresh") ? "renewed" : "logged-in",
          }),
    ),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("UC001 — lựa chọn ghi nhớ phiên", () => {
  it("không ghi nhớ vẫn dùng API được, refresh không lưu token và khởi động lại không khôi phục phiên", async () => {
    const { authService } = await import("@/services/auth-service");
    const { authStorage } = await import("@/services/auth-storage");
    await authService.login(
      { usernameOrEmail: "qa", password: "fixture-password" },
      false,
    );
    expect(await authStorage.getToken()).toBe("logged-in");
    expect(secure.values.has("access_token")).toBe(false);
    await authService.refreshAccessToken();
    expect(await authStorage.getToken()).toBe("renewed");
    expect(secure.values.has("access_token")).toBe(false);
    vi.resetModules();
    const restarted = await import("@/services/auth-storage");
    expect(await restarted.authStorage.getToken()).toBeNull();
    expect(restarted.authStorage.isCurrentSession(restarted.authStorage.getSessionVersion())).toBe(false);
    const restartedService = await import("@/services/auth-service");
    await expect(restartedService.authService.refreshAccessToken()).rejects.toMatchObject({ code: "AUTH_SESSION_ENDED" });
  });

  it("ghi nhớ lưu vào SecureStore, khôi phục sau khởi động và logout xóa phiên", async () => {
    const { authService } = await import("@/services/auth-service");
    await authService.login(
      { usernameOrEmail: "qa", password: "fixture-password" },
      true,
    );
    expect(secure.values.get("access_token")).toBe("logged-in");
    vi.resetModules();
    const { authStorage } = await import("@/services/auth-storage");
    expect(await authStorage.getToken()).toBe("logged-in");
    const restarted = await import("@/services/auth-service");
    await restarted.authService.logout();
    expect(await authStorage.getToken()).toBeNull();
    expect(secure.values.has("access_token")).toBe(false);
  });

  it("đăng nhập không ghi nhớ xóa token ghi nhớ của tài khoản trước", async () => {
    secure.values.set("access_token", "previous-account");
    secure.values.set("auth_remember_session", "1");
    const { authService } = await import("@/services/auth-service");
    await authService.login(
      { usernameOrEmail: "new-qa", password: "fixture-password" },
      false,
    );
    expect(secure.values.get("auth_remember_session")).toBe("0");
    expect(secure.values.has("access_token")).toBe(false);
    const { authStorage } = await import("@/services/auth-storage");
    expect(await authStorage.getToken()).toBe("logged-in");
  });

  it("logout phiên trong bộ nhớ gửi đúng token dù SecureStore không có token", async () => {
    const { authService } = await import("@/services/auth-service");
    await authService.login(
      { usernameOrEmail: "qa", password: "fixture-password" },
      false,
    );
    await authService.logout();
    expect(vi.mocked(fetch)).toHaveBeenLastCalledWith(
      expect.stringContaining("/logout"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer logged-in" }),
      }),
    );
  });

  it("lỗi lưu lựa chọn ghi nhớ thu hồi phiên mới và không để UI đăng nhập", async () => {
    secure.setItemAsync.mockImplementation(
      async (key: string, value: string) => {
        if (key === "auth_remember_session")
          throw new Error("fixture storage failure");
        secure.values.set(key, value);
      },
    );
    const { authService } = await import("@/services/auth-service");
    await expect(
      authService.login(
        { usernameOrEmail: "qa", password: "fixture-password" },
        true,
      ),
    ).rejects.toThrow("fixture storage failure");
    const { authStorage } = await import("@/services/auth-storage");
    expect(await authStorage.getToken()).toBeNull();
    expect(vi.mocked(fetch)).toHaveBeenLastCalledWith(
      expect.stringContaining("/logout"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer logged-in" }),
      }),
    );
  });
});

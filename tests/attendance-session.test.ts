import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({ values: new Map<string, string>(), gps: vi.fn() }));
vi.mock("expo-secure-store", () => ({
  getItemAsync: async (key: string) => fixture.values.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => { fixture.values.set(key, value); },
  deleteItemAsync: async (key: string) => { fixture.values.delete(key); },
}));
vi.mock("expo-location", () => ({
  PermissionStatus: { GRANTED: "granted" }, Accuracy: { High: 4 },
  getForegroundPermissionsAsync: async () => ({ status: "granted" }),
  requestForegroundPermissionsAsync: async () => ({ status: "granted" }),
  hasServicesEnabledAsync: async () => true,
  getCurrentPositionAsync: fixture.gps,
}));
vi.mock("@/constants", () => ({ API_BASE_URL: "https://fixture.invalid/api/v1" }));
vi.mock("@/services", async () => ({ attendanceService: (await import("@/services/attendance-service")).attendanceService }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  fixture.values.clear();
  fixture.values.set("access_token", "account-A");
  fixture.values.set("auth_remember_session", "1");
  vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith("/login")
    ? Response.json({ accessToken: "account-B" })
    : url.endsWith("/logout") ? new Response(null, { status: 204 })
    : Response.json({ workDate: "2026-11-24", checkedIn: false, checkedOut: false })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("UC009/010 — người khởi phát chấm công phải giữ đúng phiên", () => {
  it.each(["checkIn", "checkOut"] as const)("%s đang chờ GPS không được gửi bằng tài khoản mới", async (action) => {
    let finishGps!: (value: any) => void;
    fixture.gps.mockImplementation(() => new Promise((resolve) => { finishGps = resolve; }));
    const { useAttendance } = await import("@/hooks/use-attendance");
    const { authService } = await import("@/services/auth-service");
    const { result } = renderHook(() => useAttendance());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    let pending!: Promise<unknown>;
    act(() => { pending = result.current[action](); });
    const rejected = expect(pending).rejects.toMatchObject({ code: "AUTH_SESSION_ENDED" });
    await waitFor(() => expect(fixture.gps).toHaveBeenCalledOnce());
    await act(async () => {
      await authService.logout();
      await authService.login({ usernameOrEmail: "account_B", password: "fixture-password" }, true);
      finishGps({ coords: { latitude: 21, longitude: 105, accuracy: 5 }, timestamp: Date.now() });
      await rejected;
    });
    const mutationRequests = vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes("/attendance/check-"));
    expect(mutationRequests).toHaveLength(0);
  });
});

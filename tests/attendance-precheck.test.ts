import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";

const state = vi.hoisted(() => ({
  lifecycle: null as null | ((state: string) => void),
  network: null as null | (() => void),
  position: null as null | (() => void),
  refocus: null as null | (() => void),
  preCheck: vi.fn(),
  gps: vi.fn(),
  permission: vi.fn(),
  enabled: vi.fn(),
  watch: vi.fn(),
  removeWatch: vi.fn(),
  version: 1,
}));
vi.mock("expo-router", () => ({
  useFocusEffect: (effect: () => () => void) =>
    useEffect(() => {
      let stop = effect();
      state.refocus = () => {
        stop();
        stop = effect();
      };
      return () => {
        stop();
        state.refocus = null;
      };
    }, [effect]),
}));
vi.mock("react-native", () => ({
  AppState: {
    currentState: "active",
    addEventListener: (_: string, cb: typeof state.lifecycle) => {
      state.lifecycle = cb;
      return {
        remove: () => {
          state.lifecycle = null;
        },
      };
    },
  },
}));
vi.mock("expo-network", () => ({
  addNetworkStateListener: (cb: () => void) => {
    state.network = cb;
    return {
      remove: () => {
        state.network = null;
      },
    };
  },
}));
vi.mock("expo-location", () => ({
  Accuracy: { Balanced: 3, High: 4 },
  PermissionStatus: { GRANTED: "granted" },
  getForegroundPermissionsAsync: state.permission,
  hasServicesEnabledAsync: state.enabled,
  getCurrentPositionAsync: state.gps,
  watchPositionAsync: state.watch,
}));
vi.mock("@/services/attendance-service", () => ({
  attendanceService: { preCheck: state.preCheck },
}));
vi.mock("@/services/auth-storage", () => ({
  authStorage: { getSessionVersion: () => state.version },
}));
vi.mock("@/services/api", () => ({
  assertCurrentAuthSession: (version: number) => {
    if (version !== state.version) throw new Error("AUTH_SESSION_ENDED");
  },
}));
import { useAttendancePrecheck } from "@/hooks/use-attendance-precheck";

const position = () => ({
  coords: { latitude: 21, longitude: 105, accuracy: 10 },
  timestamp: Date.now(),
});
const advance = async (ms = 250) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  state.version = 1;
  state.permission.mockResolvedValue({ status: "granted" });
  state.enabled.mockResolvedValue(true);
  state.gps.mockImplementation(async () => position());
  state.watch.mockImplementation(async (_: unknown, cb: () => void) => {
    state.position = cb;
    return { remove: state.removeWatch };
  });
  state.preCheck.mockResolvedValue({ eligible: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Chỉ BE xác minh, App gửi bằng chứng ngầm trên màn chấm công", () => {
  it("gửi đủ GPS khi mở màn và không trả trạng thái điều khiển nút", async () => {
    const { result } = renderHook(() => useAttendancePrecheck());
    await advance();
    expect(result.current).toBeUndefined();
    expect(state.preCheck).toHaveBeenCalledOnce();
    expect(state.preCheck.mock.calls[0][0]).toMatchObject({
      latitude: 21,
      longitude: 105,
      accuracyMeters: 10,
    });
    expect(state.preCheck.mock.calls[0][1]).toBeInstanceOf(AbortSignal);
    expect(state.gps).toHaveBeenCalledWith(
      expect.objectContaining({ mayShowUserSettingsDialog: false }),
    );
    expect(state.watch.mock.calls[0][0]).toMatchObject({
      mayShowUserSettingsDialog: false,
    });
  });
  it("không có quyền GPS thì gửi nhóm rỗng, không xin quyền hoặc tự chặn mạng", async () => {
    state.permission.mockResolvedValue({ status: "denied" });
    renderHook(() => useAttendancePrecheck());
    await advance();
    expect(state.gps).not.toHaveBeenCalled();
    expect(state.watch).not.toHaveBeenCalled();
    expect(state.preCheck.mock.calls[0][0]).toBeUndefined();
  });
  it("kiểm tra lại khi đổi mạng và định kỳ nếu IP WAN đổi mà không có sự kiện", async () => {
    renderHook(() => useAttendancePrecheck());
    await advance();
    act(() => state.network?.());
    await advance();
    expect(state.preCheck).toHaveBeenCalledTimes(2);
    await advance(30_000);
    expect(state.preCheck).toHaveBeenCalledTimes(3);
  });
  it("bật GPS trong khi đang ở màn hình được lấy lại ở lượt tiếp theo", async () => {
    state.enabled.mockResolvedValue(false);
    renderHook(() => useAttendancePrecheck());
    await advance();
    expect(state.preCheck.mock.calls[0][0]).toBeUndefined();
    state.enabled.mockResolvedValue(true);
    await advance(30_000);
    expect(state.preCheck.mock.calls[1][0]).toMatchObject({ latitude: 21 });
  });
  it("GPS thay đổi kích hoạt lượt mới, không gửi liên tục theo từng mẫu", async () => {
    renderHook(() => useAttendancePrecheck());
    await advance();
    act(() => state.position?.());
    await advance();
    expect(state.preCheck).toHaveBeenCalledOnce();
    await advance(5_000);
    act(() => state.position?.());
    await advance();
    expect(state.preCheck).toHaveBeenCalledTimes(2);
  });
  it("lỗi BE không hiện lỗi UI và không ngăn lượt kiểm tra sau", async () => {
    state.preCheck.mockRejectedValueOnce(
      new Error("ATTENDANCE_INVALID_COMPANY_WIFI"),
    );
    renderHook(() => useAttendancePrecheck());
    await advance();
    act(() => state.network?.());
    await advance();
    expect(state.preCheck).toHaveBeenCalledTimes(2);
  });
  it("chạy nền hủy yêu cầu, ngừng định kỳ và trở lại App thì kiểm tra mới", async () => {
    state.preCheck.mockImplementationOnce(
      (_gps, signal: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("ABORTED")));
        }),
    );
    renderHook(() => useAttendancePrecheck());
    await advance();
    const signal = state.preCheck.mock.calls[0][1];
    act(() => state.lifecycle?.("background"));
    expect(signal.aborted).toBe(true);
    await advance(60_000);
    expect(state.preCheck).toHaveBeenCalledOnce();
    act(() => state.lifecycle?.("active"));
    await advance();
    expect(state.preCheck).toHaveBeenCalledTimes(2);
  });
  it("rời màn tháo listener, watcher và không còn gửi định kỳ", async () => {
    const view = renderHook(() => useAttendancePrecheck());
    await advance();
    view.unmount();
    expect(state.removeWatch).toHaveBeenCalled();
    expect(state.network).toBeNull();
    expect(state.lifecycle).toBeNull();
    await advance(60_000);
    expect(state.preCheck).toHaveBeenCalledOnce();
  });
  it("đổi tài khoản lúc chờ GPS không gửi mẫu cũ bằng phiên mới", async () => {
    let finish!: (value: unknown) => void;
    state.gps.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderHook(() => useAttendancePrecheck());
    await advance();
    state.version += 1;
    await act(async () => {
      finish(position());
    });
    expect(state.preCheck).not.toHaveBeenCalled();
  });
  it("đổi mạng lúc chờ GPS bỏ lượt cũ và chỉ gửi lượt mới", async () => {
    let finish!: (value: unknown) => void;
    state.gps.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderHook(() => useAttendancePrecheck());
    await advance();
    act(() => state.network?.());
    await advance();
    await act(async () => {
      finish(position());
    });
    await advance();
    expect(state.preCheck).toHaveBeenCalledOnce();
  });
  it("watcher tạo xong sau rời màn phải tự gỡ", async () => {
    let finish!: (value: unknown) => void;
    state.watch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const view = renderHook(() => useAttendancePrecheck());
    await advance();
    view.unmount();
    await act(async () => {
      finish({ remove: state.removeWatch });
    });
    expect(state.removeWatch).toHaveBeenCalledOnce();
  });
  it("yêu cầu đang chờ bị hủy sau 8 giây", async () => {
    state.preCheck.mockImplementation(
      (_gps, signal: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("ABORTED")));
        }),
    );
    renderHook(() => useAttendancePrecheck());
    await advance();
    const signal = state.preCheck.mock.calls[0][1];
    await advance(8_000);
    expect(signal.aborted).toBe(true);
  });

  it.each(["background", "blur", "session", "timeout"])(
    "không bắt đầu lấy GPS khi chờ quyền xong sau %s",
    async (event) => {
      let finish!: (value: unknown) => void;
      state.permission.mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
      const view = renderHook(() => useAttendancePrecheck());
      await advance();
      if (event === "background") act(() => state.lifecycle?.("background"));
      if (event === "blur") view.unmount();
      if (event === "session") state.version += 1;
      if (event === "timeout") await advance(6_000);
      await act(async () => {
        finish({ status: "granted" });
      });
      expect(state.gps).not.toHaveBeenCalled();
      if (event !== "timeout") expect(state.preCheck).not.toHaveBeenCalled();
    },
  );

  it("GPS native kéo dài không tạo thêm yêu cầu lấy vị trí ở lượt định kỳ sau", async () => {
    let finish!: (value: unknown) => void;
    state.gps.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderHook(() => useAttendancePrecheck());
    await advance();
    await advance(36_000);
    expect(state.gps).toHaveBeenCalledOnce();
    expect(state.preCheck).toHaveBeenCalledTimes(2);
    expect(state.preCheck.mock.calls.every(([gps]) => gps === undefined)).toBe(
      true,
    );
    await act(async () => {
      finish(position());
    });
  });

  it("blur/refocus và remount không chồng GPS native của màn trước", async () => {
    let finish!: (value: unknown) => void;
    state.gps.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const first = renderHook(() => useAttendancePrecheck());
    await advance();
    act(() => state.refocus?.());
    await advance();
    expect(state.gps).toHaveBeenCalledOnce();
    first.unmount();
    renderHook(() => useAttendancePrecheck());
    await advance();
    expect(state.gps).toHaveBeenCalledOnce();
    await act(async () => {
      finish(position());
    });
    act(() => state.network?.());
    await advance();
    expect(state.gps).toHaveBeenCalledTimes(2);
  });
});

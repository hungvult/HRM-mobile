import { afterEach, describe, expect, it, vi } from "vitest";
import { optionalAttendanceLocation } from "../src/utils/optional-attendance-location";

afterEach(() => vi.useRealTimers());
describe("UC009/010 — GPS tùy chọn trước khi xác minh Wi-Fi", () => {
  it("giữ nguyên bằng chứng GPS thực do thiết bị trả về", async () => {
    const location = {
      latitude: 21,
      longitude: 105,
      accuracyMeters: 8,
      locationCapturedAt: "2026-11-24T08:00:00Z",
    };
    expect(await optionalAttendanceLocation(async () => location)).toBe(
      location,
    );
  });
  it("từ chối quyền không chặn gửi yêu cầu Wi-Fi và không tạo tọa độ", async () => {
    expect(
      await optionalAttendanceLocation(async () => {
        throw new Error("location permission denied");
      }),
    ).toBeUndefined();
  });
  it("mất tín hiệu lâu chỉ chờ thời gian hữu hạn, phản hồi GPS muộn không đổi kết quả đã trả", async () => {
    vi.useFakeTimers();
    let resolve!: (value: any) => void;
    const pending = optionalAttendanceLocation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
      100,
    );
    await vi.advanceTimersByTimeAsync(101);
    expect(await pending).toBeUndefined();
    resolve({
      latitude: 21,
      longitude: 105,
      accuracyMeters: 5,
      locationCapturedAt: "2026-11-24T08:00:00Z",
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});

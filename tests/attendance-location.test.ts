import { describe, expect, it, vi } from "vitest";
import { toAttendanceLocation } from "../src/utils/attendance-location";
vi.mock("../src/services/api", () => ({ request: vi.fn() }));
import { request } from "../src/services/api";
import { attendanceService } from "../src/services/attendance-service";

const position = {
  coords: { latitude: 10.776889, longitude: 106.700806, accuracy: 8.5 },
  timestamp: Date.parse("2026-10-28T08:00:00Z"),
};
describe("production attendance GPS contract", () => {
  it("preserves the actual GPS accuracy and capture timestamp", () => {
    expect(toAttendanceLocation(position)).toEqual({
      latitude: 10.776889,
      longitude: 106.700806,
      accuracyMeters: 8.5,
      locationCapturedAt: "2026-10-28T08:00:00.000Z",
    });
  });
  it("rejects unavailable or invalid readings without inventing accuracy", () => {
    for (const accuracy of [null, 0, -1, NaN, Infinity])
      expect(
        toAttendanceLocation({
          ...position,
          coords: { ...position.coords, accuracy },
        }),
      ).toBeNull();
    expect(toAttendanceLocation({ ...position, timestamp: NaN })).toBeNull();
    expect(
      toAttendanceLocation({
        ...position,
        coords: { ...position.coords, latitude: 91 },
      }),
    ).toBeNull();
  });
  it("sends all four mandatory backend fields for check-in and check-out", async () => {
    const location = toAttendanceLocation(position)!;
    for (const action of ["checkIn", "checkOut"] as const) {
      vi.mocked(request).mockClear();
      await attendanceService[action](location);
      expect(request).toHaveBeenCalledWith(
        action === "checkIn" ? "/attendance/check-in" : "/attendance/check-out",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(location),
          requiresAuth: true,
        }),
      );
    }
  });
});

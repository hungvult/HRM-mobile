import type { AttendanceLocationRequest } from "../types";

export function toAttendanceLocation(position: {
  coords: { latitude: number; longitude: number; accuracy: number | null };
  timestamp: number;
}): AttendanceLocationRequest | null {
  const { latitude, longitude, accuracy } = position.coords;
  const capturedAt = new Date(position.timestamp);
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180 ||
    accuracy == null ||
    !Number.isFinite(accuracy) ||
    accuracy <= 0 ||
    !Number.isFinite(position.timestamp) ||
    !Number.isFinite(capturedAt.getTime())
  )
    return null;
  return {
    latitude,
    longitude,
    accuracyMeters: accuracy,
    locationCapturedAt: capturedAt.toISOString(),
  };
}

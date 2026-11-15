import { AttendanceLocationRequest } from "../types/attendance";

// Dùng trước check-in/out: ưu tiên GPS mới do thiết bị đọc, nhưng thiếu quyền hoặc mất tín hiệu không chặn xác minh Wi-Fi.
// Hết thời gian thì trả undefined để service gửi nhóm GPS rỗng; không suy đoán IP, địa điểm hoặc độ chính xác.
export async function optionalAttendanceLocation(
  acquire: () => Promise<AttendanceLocationRequest>,
  timeoutMs = 6000,
): Promise<AttendanceLocationRequest | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      acquire().catch(() => undefined),
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => resolve(undefined), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

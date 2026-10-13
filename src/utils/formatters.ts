import { colors } from "../constants";

export interface StatusConfig {
  label: string;
  bg: string;
  text: string;
}

export function getStatusConfig(status?: string): StatusConfig {
  switch (status) {
    case "WORKING":
      return {
        label: "Đang làm việc",
        bg: colors.successSubtle,
        text: colors.success,
      };
    case "ON_LEAVE":
      return {
        label: "Nghỉ phép",
        bg: colors.warningSubtle,
        text: colors.warning,
      };
    case "TERMINATED":
      return {
        label: "Đã thôi việc",
        bg: colors.dangerSubtle,
        text: colors.danger,
      };
    case "PROBATION":
      return {
        label: "Thử việc",
        bg: colors.primarySubtle,
        text: colors.primary,
      };
    case "RESIGNED":
      return {
        label: "Đã nghỉ việc",
        bg: colors.border,
        text: colors.textSecondary,
      };
    default:
      return {
        label: status || "Hoạt động",
        bg: colors.primarySubtle,
        text: colors.primary,
      };
  }
}

export function getAvatarLetter(
  name?: string,
  fallbackUsername?: string,
): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    const lastWord = parts[parts.length - 1];
    return lastWord.charAt(0).toUpperCase() || "U";
  }
  return fallbackUsername?.trim().charAt(0).toUpperCase() || "U";
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = cleanDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return cleanDate;
}

export function formatGender(gender?: string): string {
  switch (gender) {
    case "MALE":
      return "Nam";
    case "FEMALE":
      return "Nữ";
    case "OTHER":
      return "Khác";
    default:
      return gender || "";
  }
}

export function formatRoles(roles?: string[]): string {
  if (!roles || roles.length === 0) return "";
  return roles
    .map((role) => {
      switch (role) {
        case "ADMIN":
          return "Quản trị viên";
        case "HR":
          return "Nhân sự (HR)";
        case "EMPLOYEE":
          return "Nhân viên";
        case "MANAGER":
          return "Quản lý";
        default:
          return role;
      }
    })
    .join(", ");
}

export function formatTime(isoStr?: string | null): string {
  if (!isoStr) return "--:--";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "--:--";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "--:--";
  }
}

export function formatTimeWithSeconds(isoStr?: string | null): string {
  if (!isoStr) return "--:--:--";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "--:--:--";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  } catch {
    return "--:--:--";
  }
}

export function formatWorkingDuration(minutes?: number | null): string {
  if (minutes === null || minutes === undefined) return "0 phút";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

export function formatLiveDuration(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function formatVietnameseDate(date: Date): string {
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${dayName}, ngày ${day} tháng ${month}, ${year}`;
}

export function getAttendanceStatusConfig(
  status?: string | null,
): StatusConfig {
  switch (status) {
    case "PRESENT":
      return {
        label: "Đã chấm công",
        bg: colors.successSubtle,
        text: colors.success,
      };
    case "LATE":
      return {
        label: "Đi muộn",
        bg: colors.warningSubtle,
        text: colors.warning,
      };
    case "INCOMPLETE":
      return {
        label: "Chưa hoàn tất",
        bg: colors.warningSubtle,
        text: colors.warning,
      };
    case "EARLY_LEAVE":
      return {
        label: "Về sớm",
        bg: colors.warningSubtle,
        text: colors.warning,
      };
    case "LATE_AND_EARLY_LEAVE":
      return {
        label: "Muộn & Về sớm",
        bg: colors.dangerSubtle,
        text: colors.danger,
      };
    case "ABSENT":
      return {
        label: "Vắng mặt",
        bg: colors.dangerSubtle,
        text: colors.danger,
      };
    case "LEAVE":
      return {
        label: "Nghỉ phép",
        bg: colors.primarySubtle,
        text: colors.primary,
      };
    case "HOLIDAY":
      return {
        label: "Nghỉ lễ",
        bg: "#F3E8FF",
        text: "#7E22CE",
      };
    default:
      return {
        label: "Chưa ghi nhận",
        bg: colors.border,
        text: colors.textSecondary,
      };
  }
}

/**
 * Parse YYYY-MM-DD safely into a local Date without timezone offset shift
 */
export function parseWorkDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  if (
    parts.length === 3 &&
    !isNaN(parts[0]) &&
    !isNaN(parts[1]) &&
    !isNaN(parts[2])
  ) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
}

/**
 * Format "YYYY-MM" to "Tháng MM/YYYY"
 */
export function formatMonthYear(yearMonthStr: string): string {
  if (!yearMonthStr) return "";
  const parts = yearMonthStr.split("-");
  if (parts.length === 2) {
    return `Tháng ${parts[1]}/${parts[0]}`;
  }
  return yearMonthStr;
}

/**
 * Format "YYYY-MM-DD" to "Thứ X, DD/MM"
 */
export function formatWorkDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = parseWorkDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dayName = days[d.getDay()];
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${dayName}, ${day}/${month}`;
}

/**
 * Format "YYYY-MM-DD" to "Thứ X, DD/MM/YYYY"
 */
export function formatFullWorkDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = parseWorkDate(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dayName = days[d.getDay()];
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
}

/**
 * Check if text contains accented Vietnamese characters
 */
export function isVietnameseText(text?: string | null): boolean {
  if (!text) return false;
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
    text,
  );
}

/**
 * Map API and system errors to user-friendly Vietnamese messages.
 * Prevents raw English strings from leaking to the UI.
 */
export function getFriendlyErrorMessage(
  err: unknown,
  fallbackMessage = "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
): string {
  if (!err) return fallbackMessage;

  if (typeof err === "string") {
    return isVietnameseText(err) ? err : fallbackMessage;
  }

  const apiErr = err as {
    code?: string;
    status?: number;
    message?: string;
    errors?: Array<{ field: string; message: string }>;
  };

  // 1. Business domain error codes
  if (apiErr.code === "ATTENDANCE_ALREADY_CHECKED_IN") {
    return "Bạn đã check-in trước đó.";
  }
  if (apiErr.code === "ATTENDANCE_ALREADY_CHECKED_OUT") {
    return "Bạn đã check-out trước đó.";
  }
  if (apiErr.code === "ATTENDANCE_CHECK_IN_REQUIRED") {
    return "Bạn chưa check-in, không thể check-out.";
  }
  if (apiErr.code === "ATTENDANCE_INVALID_COMPANY_WIFI") {
    return "Thiết bị chưa kết nối Wi-Fi hợp lệ của công ty. Vui lòng kết nối đúng mạng Wi-Fi văn phòng.";
  }
  if (apiErr.code === "ATTENDANCE_OUTSIDE_WORK_LOCATION") {
    return "Bạn đang ở ngoài khu vực làm việc cho phép của văn phòng.";
  }
  if (apiErr.code === "ATTENDANCE_INVALID_GPS") {
    return "Tọa độ GPS không hợp lệ hoặc thiết bị chưa bật định vị.";
  }
  if (apiErr.code === "ATTENDANCE_EMPLOYEE_NOT_FOUND") {
    return "Tài khoản không có hồ sơ nhân viên liên kết để thực hiện chấm công.";
  }
  if (apiErr.code === "ATTENDANCE_EMPLOYEE_INACTIVE") {
    return "Nhân viên không ở trạng thái được phép chấm công.";
  }
  if (
    apiErr.code === "AUTH_FORBIDDEN" ||
    apiErr.code === "FORBIDDEN" ||
    apiErr.code === "AUTH_FORBIDDEN_SCOPE" ||
    apiErr.status === 403
  ) {
    if (apiErr.message && isVietnameseText(apiErr.message)) {
      return apiErr.message;
    }
    return "Bạn không có quyền thực hiện chấm công. Vui lòng liên hệ quản lý hoặc nhân sự.";
  }
  if (
    apiErr.code === "AUTH_UNAUTHORIZED" ||
    apiErr.code === "UNAUTHORIZED" ||
    apiErr.status === 401
  ) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }
  if (apiErr.code === "TIMEOUT_ERROR" || apiErr.status === 408) {
    return "Quá thời gian kết nối đến máy chủ. Vui lòng thử lại sau.";
  }
  if (apiErr.code === "NETWORK_ERROR" || apiErr.status === 0) {
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.";
  }
  if (apiErr.status && apiErr.status >= 500) {
    return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
  }

  // 2. If backend already sent a friendly Vietnamese message, prioritize it
  if (apiErr.message && isVietnameseText(apiErr.message)) {
    return apiErr.message;
  }

  return fallbackMessage;
}

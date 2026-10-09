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

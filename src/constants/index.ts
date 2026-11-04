export const APP_NAME = "HRM Mobile";
// Form chọn ảnh và bước gửi đơn dùng chung giới hạn mà backend áp dụng cho ảnh minh chứng.
export const MAX_LEAVE_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export * from "./theme";

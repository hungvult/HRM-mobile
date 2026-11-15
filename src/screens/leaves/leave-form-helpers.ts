import type { ImagePickerAsset } from "expo-image-picker";
import type { LeaveAttachmentUpload } from "../../types/leave";
import { calculateWorkingDays, parseWorkDate } from "../../utils/formatters";
export { MAX_LEAVE_ATTACHMENT_BYTES } from "../../constants";
import { MAX_LEAVE_ATTACHMENT_BYTES } from "../../constants";

export const MAX_CANCEL_REASON_LENGTH = 1000;

// Ngày từ ô nhập phải thật sự tồn tại; không để JavaScript đổi 31/02 thành ngày tháng sau.
function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseWorkDate(value);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getDate() === Number(value.slice(8, 10))
  );
}

/**
 * Dùng khi nhập ngày và trước khi gửi đơn. Các ngày là YYYY-MM-DD của form, today là ngày thiết bị.
 * Chỉ đếm Thứ Hai–Thứ Sáu, gồm cả hai đầu giống backend; không tự trừ ngày lễ.
 * Trả lỗi tại từng ô để màn hình chặn khoảng quá khứ/ngược/không có ngày làm việc.
 * Không ghi dữ liệu; backend vẫn tính lại requestedDays khi nhận đơn.
 */
export function getLeaveDatePreview(start: string, end: string, today: string) {
  let startError: string | null = null;
  let endError: string | null = null;
  if (!isIsoDate(start)) startError = "Ngày bắt đầu không hợp lệ (YYYY-MM-DD).";
  else if (start < today) startError = "Không thể chọn ngày trong quá khứ.";
  if (!isIsoDate(end)) endError = "Ngày kết thúc không hợp lệ (YYYY-MM-DD).";
  else if (isIsoDate(start) && end < start)
    endError = "Ngày kết thúc không được trước ngày bắt đầu.";
  const days = startError || endError ? 0 : calculateWorkingDays(start, end);
  if (!startError && !endError && days === 0)
    endError = "Khoảng thời gian đăng ký không có ngày làm việc.";
  return { days, startError, endError };
}

/**
 * Dùng sau khi chọn một ảnh trong thư viện. MIME/kích thước lấy từ ImagePicker hoặc File trên Web.
 * Chỉ trả ảnh JPG/PNG/WebP có kích thước xác định và tối đa 5 MB; sai thì ném lỗi để giữ ảnh cũ.
 * Đây là kiểm tra phía app, backend vẫn phải đọc nội dung thực tế trước khi lưu cùng đơn.
 */
export function getLeaveAttachment(
  asset: ImagePickerAsset,
): LeaveAttachmentUpload {
  const sizeBytes = asset.file?.size ?? asset.fileSize;
  const name =
    asset.fileName || asset.uri.split("/").pop()?.split("?")[0] || "";
  const extension = name.split(".").pop()?.toLowerCase();
  const inferred =
    extension === "jpg" || extension === "jpeg"
      ? "image/jpeg"
      : extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : "";
  const contentType = asset.mimeType || asset.file?.type || inferred;
  if (
    contentType !== "image/jpeg" &&
    contentType !== "image/png" &&
    contentType !== "image/webp"
  )
    throw new Error("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.");
  if (!sizeBytes || !Number.isFinite(sizeBytes) || sizeBytes < 0)
    throw new Error(
      "Không xác định được kích thước ảnh. Vui lòng chọn ảnh khác.",
    );
  if (sizeBytes > MAX_LEAVE_ATTACHMENT_BYTES)
    throw new Error("Ảnh minh chứng không được vượt quá 5 MB.");
  return {
    uri: asset.uri,
    fileName:
      name ||
      `minh-chung.${contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1]}`,
    contentType,
    sizeBytes,
    file: asset.file,
  };
}

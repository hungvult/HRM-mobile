import {
  CancelLeaveRequestResponse,
  CreateLeaveRequestPayload,
  CreateLeaveRequestResponse,
  GetMyLeaveRequestsParams,
  LeaveBalanceResponse,
  LeaveRequestDetail,
  LeaveRequestPageResponse,
  LeaveType,
  LeaveAttachmentUpload,
} from "../types";
import { Platform } from "react-native";
import { File as FileSystemFile } from "expo-file-system";
import { assertCurrentAuthSession, request } from "./api";
import { authStorage } from "./auth-storage";
import { MAX_LEAVE_ATTACHMENT_BYTES } from "../constants";

/**
 * Dùng khi đơn có ảnh: phần request phải là application/json để backend đọc được @RequestPart.
 * Dữ liệu đơn lấy từ form; URI ảnh do ImagePicker trả về, không phải ID đơn hoặc đường dẫn trên VPS.
 * Expo 57 đọc Blob hoặc phần có bytes(), không nhận đối tượng uri/type/name của fetch React Native cũ.
 * Hàm chỉ chuẩn bị nội dung gửi; backend mới kiểm ảnh và lưu cùng đơn, không ghi file tạm hoặc DB ở đây.
 */
function createMultipartBody(
  payload: CreateLeaveRequestPayload,
  attachment: LeaveAttachmentUpload,
): FormData {
  const body = new FormData();
  const json = JSON.stringify(payload);
  // Blob giữ application/json và tiếng Việt để backend đọc phần request giống luồng không ảnh.
  body.append(
    "request",
    new Blob([json], { type: "application/json" }),
    "request.json",
  );
  if (Platform.OS === "web") {
    if (!attachment.file)
      throw new Error("Không đọc được ảnh đã chọn. Vui lòng chọn lại.");
    body.append("attachment", attachment.file, attachment.fileName);
  } else {
    // Ảnh trong cache có thể đã bị xóa hoặc đổi sau khi chọn; kiểm lại file trước khi gửi.
    let file: FileSystemFile;
    try {
      file = new FileSystemFile(attachment.uri);
      if (!file.exists || file.size <= 0)
        throw new Error("Ảnh không còn đọc được.");
    } catch {
      throw new Error("Không đọc được ảnh đã chọn. Vui lòng chọn lại.");
    }
    if (file.size > MAX_LEAVE_ATTACHMENT_BYTES)
      throw new Error("Ảnh minh chứng không được vượt quá 5 MB.");

    // Expo gọi bytes() khi đóng gói multipart. Giữ tên/MIME từ ảnh đã chọn thay vì tên cache ngẫu nhiên.
    // Đối tượng này theo giao diện File mà Expo hỗ trợ; không đưa URI thuần vào FormData nữa.
    body.append("attachment", {
      type: attachment.contentType,
      name: attachment.fileName,
      bytes: () => file.bytes(),
    } as unknown as Blob);
  }
  return body;
}

export const leaveService = {
  /**
   * Lấy danh mục các loại nghỉ phép còn hiệu lực
   * GET /api/v1/leave-types
   */
  async getLeaveTypes(): Promise<LeaveType[]> {
    return await request<LeaveType[]>("/leave-types", {
      method: "GET",
      requiresAuth: true,
    });
  },

  /**
   * Lấy số dư quỹ phép cá nhân theo năm
   * GET /api/v1/me/leave-balances?year={year}
   */
  async getLeaveBalances(year: number): Promise<LeaveBalanceResponse> {
    return await request<LeaveBalanceResponse>(
      `/me/leave-balances?year=${year}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  },

  /**
   * Gửi đơn từ form; leaveTypeId là ID danh mục, nhân viên do backend lấy từ bearer.
   * Không có ảnh giữ JSON cũ; có ảnh gửi multipart gồm request(JSON) và attachment(file).
   * Không tự gửi lại POST kể cả sau 401/lỗi mạng; lỗi trả về cho form giữ dữ liệu để người dùng kiểm tra.
   */
  async createLeaveRequest(
    payload: CreateLeaveRequestPayload,
    attachment?: LeaveAttachmentUpload | null,
  ): Promise<CreateLeaveRequestResponse> {
    return await request<CreateLeaveRequestResponse>("/leave-requests", {
      method: "POST",
      body: attachment
        ? createMultipartBody(payload, attachment)
        : JSON.stringify(payload),
      requiresAuth: true,
      _isRetry: true,
    });
  },

  /**
   * Lấy danh sách đơn nghỉ phép cá nhân (có phân trang và bộ lọc)
   * GET /api/v1/me/leave-requests
   */
  async getMyLeaveRequests(
    params: GetMyLeaveRequestsParams = {},
  ): Promise<LeaveRequestPageResponse> {
    const queryParts: string[] = [];

    const page = params.page ?? 0;
    const size = params.size ?? 20;
    queryParts.push(`page=${page}`);
    queryParts.push(`size=${size}`);

    if (params.status) {
      queryParts.push(`status=${encodeURIComponent(params.status)}`);
    }

    if (params.leaveTypeId) {
      queryParts.push(`leaveTypeId=${params.leaveTypeId}`);
    }

    if (params.fromDate) {
      queryParts.push(`fromDate=${encodeURIComponent(params.fromDate)}`);
    }

    if (params.toDate) {
      queryParts.push(`toDate=${encodeURIComponent(params.toDate)}`);
    }

    const queryStr = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

    return await request<LeaveRequestPageResponse>(
      `/me/leave-requests${queryStr}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  },

  /**
   * Xem chi tiết đơn nghỉ phép và lịch sử duyệt
   * GET /api/v1/leave-requests/{id}
   */
  async getLeaveRequestDetail(id: number): Promise<LeaveRequestDetail> {
    return await request<LeaveRequestDetail>(`/leave-requests/${id}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  /**
   * Dùng khi chi tiết có metadata ảnh. id là ID leave_requests, không dùng URL tùy ý từ phản hồi.
   * GET ảnh bằng bearer qua transport chung; backend kiểm tra quyền xem đơn trước khi trả nội dung.
   * Chuyển Blob thành data URI chỉ trong bộ nhớ để Image không tự gọi URL riêng hoặc cache ảnh theo URL.
   * Logout trong lúc tải/đọc ảnh làm kết quả bị loại; không ghi ảnh xuống bộ nhớ thiết bị.
   */
  async getAttachmentPreview(id: number): Promise<string> {
    const version = authStorage.getSessionVersion();
    const blob = await request<Blob>(`/leave-requests/${id}/attachment`, {
      method: "GET",
      requiresAuth: true,
      responseType: "blob",
    });
    assertCurrentAuthSession(version);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(blob.type) ||
      blob.size > 5 * 1024 * 1024
    )
      throw new Error("Ảnh minh chứng không hợp lệ.");
    const uri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () =>
        reject(new Error("Không đọc được ảnh minh chứng."));
      reader.onabort = () => reject(new Error("Đã dừng đọc ảnh minh chứng."));
      reader.onload = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject(new Error("Không đọc được ảnh minh chứng."));
      reader.readAsDataURL(blob);
    });
    assertCurrentAuthSession(version);
    return uri;
  },

  /**
   * Hủy đơn PENDING đang xem; id là ID leave_requests, reason là lý do tùy chọn từ modal.
   * Trim lý do trước khi gửi, tối đa 1.000 ký tự; backend tự kiểm tra chủ đơn và trạng thái dưới khóa.
   * Trả lịch sử mới chứa note để màn hình hiển thị. Không tự retry POST hoặc tự tính hoàn quỹ phép.
   */
  async cancelLeaveRequest(
    id: number,
    reason?: string,
  ): Promise<CancelLeaveRequestResponse> {
    const note = reason?.trim();
    if (note && note.length > 1000)
      throw new Error("Lý do hủy đơn tối đa 1.000 ký tự.");
    return await request<CancelLeaveRequestResponse>(
      `/leave-requests/${id}/cancel`,
      {
        method: "POST",
        requiresAuth: true,
        body: note ? JSON.stringify({ reason: note }) : undefined,
        _isRetry: true,
      },
    );
  },
};

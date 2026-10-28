import {
  CancelLeaveRequestResponse,
  CreateLeaveRequestPayload,
  CreateLeaveRequestResponse,
  GetMyLeaveRequestsParams,
  LeaveBalanceResponse,
  LeaveRequestDetail,
  LeaveRequestPageResponse,
  LeaveType,
} from "../types";
import { request } from "./api";

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
   * Tạo mới đơn xin nghỉ phép
   * POST /api/v1/leave-requests
   */
  async createLeaveRequest(
    payload: CreateLeaveRequestPayload,
  ): Promise<CreateLeaveRequestResponse> {
    return await request<CreateLeaveRequestResponse>("/leave-requests", {
      method: "POST",
      body: JSON.stringify(payload),
      requiresAuth: true,
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
   * Hủy đơn nghỉ phép đang ở trạng thái PENDING
   * POST /api/v1/leave-requests/{id}/cancel
   */
  async cancelLeaveRequest(id: number): Promise<CancelLeaveRequestResponse> {
    return await request<CancelLeaveRequestResponse>(
      `/leave-requests/${id}/cancel`,
      {
        method: "POST",
        requiresAuth: true,
      },
    );
  },
};

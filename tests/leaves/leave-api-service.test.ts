import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock expo-secure-store before importing api/leave-service
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn().mockResolvedValue("mock-jwt-access-token"),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
}));

import { ApiError } from "@/services/api";
import { leaveService } from "@/services/leave-service";

describe("Leave API Service (Đặc tả API HRM - QLNghiPhep Mục 45 - 50)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ==========================================
  // API 45: GET /api/v1/leave-types
  // ==========================================
  describe("API 45: GET /api/v1/leave-types", () => {
    it("[TC-LT-01] Lấy danh mục loại nghỉ phép thành công (200 OK)", async () => {
      const mockTypes = [
        {
          id: 1,
          code: "ANNUAL",
          name: "Nghỉ phép năm",
          annualQuotaDays: 12,
          paid: true,
        },
        {
          id: 2,
          code: "SICK",
          name: "Nghỉ ốm đau",
          annualQuotaDays: 30,
          paid: true,
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockTypes,
      } as Response);

      const res = await leaveService.getLeaveTypes();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/leave-types"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-access-token",
          }),
        }),
      );
      expect(res).toEqual(mockTypes);
      expect(res).toHaveLength(2);
      expect(res[0].code).toBe("ANNUAL");
    });

    it("[TC-LT-02] Lỗi 401 khi token không hợp lệ (AUTH_UNAUTHORIZED)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "AUTH_UNAUTHORIZED",
          message: "Bạn chưa đăng nhập hoặc phiên đăng nhập không hợp lệ.",
        }),
      } as Response);

      await expect(leaveService.getLeaveTypes()).rejects.toMatchObject({
        code: "AUTH_UNAUTHORIZED",
      });
    });
  });

  // ==========================================
  // API 46: GET /api/v1/me/leave-balances?year={year}
  // ==========================================
  describe("API 46: GET /api/v1/me/leave-balances", () => {
    it("[TC-LB-01] Lấy số dư phép cá nhân thành công theo năm (200 OK)", async () => {
      const mockBalances = {
        year: 2026,
        items: [
          {
            leaveTypeId: 1,
            leaveTypeCode: "ANNUAL",
            leaveTypeName: "Nghỉ phép năm",
            allocatedDays: 12,
            usedDays: 3,
            remainingDays: 9,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockBalances,
      } as Response);

      const res = await leaveService.getLeaveBalances(2026);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/me/leave-balances?year=2026"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-access-token",
          }),
        }),
      );
      expect(res.year).toBe(2026);
      expect(res.items[0].remainingDays).toBe(9);
    });

    it("[TC-LB-02] Lỗi 400 khi năm không hợp lệ (VALIDATION_ERROR)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "VALIDATION_ERROR",
          message: "year phải trong khoảng 2000 đến 2100.",
        }),
      } as Response);

      await expect(leaveService.getLeaveBalances(1999)).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    });

    it("[TC-LB-03] Lỗi 403 khi tài khoản chưa có hồ sơ nhân viên (EMPLOYEE_PROFILE_REQUIRED)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "EMPLOYEE_PROFILE_REQUIRED",
          message: "Tài khoản chưa có hồ sơ nhân viên.",
        }),
      } as Response);

      await expect(leaveService.getLeaveBalances(2026)).rejects.toMatchObject({
        code: "EMPLOYEE_PROFILE_REQUIRED",
      });
    });
  });

  // ==========================================
  // API 47: POST /api/v1/leave-requests
  // ==========================================
  describe("API 47: POST /api/v1/leave-requests", () => {
    it("[TC-CR-01] Gửi đơn nghỉ phép thành công (201 Created)", async () => {
      const mockCreated = {
        id: 42,
        requestCode: "NP000042",
        leaveTypeId: 1,
        startDate: "2026-10-20",
        endDate: "2026-10-21",
        requestedDays: 2,
        status: "PENDING" as const,
        createdAt: "2026-10-13T09:00:00+07:00",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockCreated,
      } as Response);

      const payload = {
        leaveTypeId: 1,
        startDate: "2026-10-20",
        endDate: "2026-10-21",
        reason: "Giải quyết việc cá nhân gia đình",
      };

      const res = await leaveService.createLeaveRequest(payload);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/leave-requests"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-access-token",
            "Content-Type": expect.stringContaining("application/json"),
          }),
          body: JSON.stringify(payload),
        }),
      );
      expect(res.id).toBe(42);
      expect(res.requestCode).toBe("NP000042");
      expect(res.status).toBe("PENDING");
    });

    it("[TC-CR-02] Lỗi 400 khi số dư không đủ (LEAVE_BALANCE_INSUFFICIENT)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "LEAVE_BALANCE_INSUFFICIENT",
          message: "Số dư phép còn lại không đủ để gửi đơn này.",
        }),
      } as Response);

      await expect(
        leaveService.createLeaveRequest({
          leaveTypeId: 1,
          startDate: "2026-10-20",
          endDate: "2026-10-25",
          reason: "Nghỉ phép dài ngày",
        }),
      ).rejects.toMatchObject({
        code: "LEAVE_BALANCE_INSUFFICIENT",
      });
    });

    it("[TC-CR-03] Lỗi 409 khi đơn bị trùng lặp lịch nghỉ (LEAVE_REQUEST_OVERLAP)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "LEAVE_REQUEST_OVERLAP",
          message:
            "Khoảng ngày nghỉ bị chồng lấn với đơn đang chờ duyệt hoặc đã được duyệt.",
        }),
      } as Response);

      await expect(
        leaveService.createLeaveRequest({
          leaveTypeId: 1,
          startDate: "2026-10-20",
          endDate: "2026-10-21",
          reason: "Nghỉ việc cá nhân",
        }),
      ).rejects.toMatchObject({
        code: "LEAVE_REQUEST_OVERLAP",
      });
    });

    it("[TC-CR-04] Lỗi 409 khi không tìm thấy quản lý trực tiếp duyệt đơn (LEAVE_REQUEST_REVIEWER_NOT_FOUND)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "LEAVE_REQUEST_REVIEWER_NOT_FOUND",
          message:
            "Không tìm thấy quản lý trực tiếp hoặc nhân sự đang hoạt động để xử lý đơn nghỉ phép.",
        }),
      } as Response);

      await expect(
        leaveService.createLeaveRequest({
          leaveTypeId: 1,
          startDate: "2026-10-20",
          endDate: "2026-10-21",
          reason: "Nghỉ việc cá nhân",
        }),
      ).rejects.toMatchObject({
        code: "LEAVE_REQUEST_REVIEWER_NOT_FOUND",
      });
    });
  });

  // ==========================================
  // API 48: GET /api/v1/me/leave-requests
  // ==========================================
  describe("API 48: GET /api/v1/me/leave-requests", () => {
    it("[TC-MR-01] Lấy danh sách đơn cá nhân thành công với phân trang & bộ lọc", async () => {
      const mockPage = {
        content: [
          {
            id: 42,
            requestCode: "NP000042",
            employeeId: 12,
            employeeCode: "NV000012",
            employeeName: "Nguyễn Văn A",
            leaveTypeId: 1,
            leaveTypeCode: "ANNUAL",
            leaveTypeName: "Nghỉ phép năm",
            startDate: "2026-10-20",
            endDate: "2026-10-21",
            requestedDays: 2,
            status: "PENDING" as const,
            createdAt: "2026-10-13T09:00:00+07:00",
          },
        ],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockPage,
      } as Response);

      const res = await leaveService.getMyLeaveRequests({
        page: 0,
        size: 20,
        status: "PENDING",
        leaveTypeId: 1,
        fromDate: "2026-10-01",
        toDate: "2026-10-31",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/me/leave-requests?page=0&size=20&status=PENDING&leaveTypeId=1&fromDate=2026-10-01&toDate=2026-10-31",
        ),
        expect.objectContaining({ method: "GET" }),
      );
      expect(res.content).toHaveLength(1);
      expect(res.content[0].requestCode).toBe("NP000042");
    });
  });

  // ==========================================
  // API 49: GET /api/v1/leave-requests/{id}
  // ==========================================
  describe("API 49: GET /api/v1/leave-requests/{id}", () => {
    it("[TC-DT-01] Xem chi tiết đơn nghỉ phép thành công (200 OK)", async () => {
      const mockDetail = {
        id: 42,
        requestCode: "NP000042",
        employeeId: 12,
        employeeCode: "NV000012",
        employeeName: "Nguyễn Văn A",
        leaveTypeId: 1,
        leaveTypeCode: "ANNUAL",
        leaveTypeName: "Nghỉ phép năm",
        startDate: "2026-10-20",
        endDate: "2026-10-21",
        requestedDays: 2,
        reason: "Giải quyết việc cá nhân gia đình",
        status: "PENDING" as const,
        reviewedByEmployeeId: null,
        reviewedAt: null,
        rejectionReason: null,
        cancelledAt: null,
        createdAt: "2026-10-13T09:00:00+07:00",
        updatedAt: "2026-10-13T09:00:00+07:00",
        statusHistory: [
          {
            oldStatus: null,
            newStatus: "PENDING" as const,
            changedByEmployeeId: 12,
            changedByEmployeeName: "Nguyễn Văn A",
            changedAt: "2026-10-13T09:00:00+07:00",
            note: null,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockDetail,
      } as Response);

      const res = await leaveService.getLeaveRequestDetail(42);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/leave-requests/42"),
        expect.objectContaining({ method: "GET" }),
      );
      expect(res.requestCode).toBe("NP000042");
      expect(res.statusHistory).toHaveLength(1);
    });

    it("[TC-DT-02] Lỗi 404 khi không tìm thấy đơn (LEAVE_REQUEST_NOT_FOUND)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "LEAVE_REQUEST_NOT_FOUND",
          message: "Không tìm thấy đơn nghỉ phép.",
        }),
      } as Response);

      await expect(
        leaveService.getLeaveRequestDetail(999),
      ).rejects.toMatchObject({
        code: "LEAVE_REQUEST_NOT_FOUND",
      });
    });

    it("[TC-DT-03] Lỗi 403 khi truy cập ngoài phạm vi quyền (AUTH_FORBIDDEN_SCOPE)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "AUTH_FORBIDDEN_SCOPE",
          message: "Bạn không có quyền truy cập đơn nghỉ phép này.",
        }),
      } as Response);

      await expect(
        leaveService.getLeaveRequestDetail(42),
      ).rejects.toMatchObject({
        code: "AUTH_FORBIDDEN_SCOPE",
      });
    });
  });

  // ==========================================
  // API 50: POST /api/v1/leave-requests/{id}/cancel
  // ==========================================
  describe("API 50: POST /api/v1/leave-requests/{id}/cancel", () => {
    it("[TC-CN-01] Hủy đơn nghỉ phép thành công (200 OK)", async () => {
      const mockCancelled = {
        id: 42,
        requestCode: "NP000042",
        status: "CANCELLED" as const,
        cancelledAt: "2026-10-13T10:00:00+07:00",
        updatedAt: "2026-10-13T10:00:00+07:00",
        statusHistory: [
          {
            oldStatus: "PENDING" as const,
            newStatus: "CANCELLED" as const,
            changedByEmployeeId: 12,
            changedByEmployeeName: "Nguyễn Văn A",
            changedAt: "2026-10-13T10:00:00+07:00",
            note: null,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockCancelled,
      } as Response);

      const res = await leaveService.cancelLeaveRequest(42);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/leave-requests/42/cancel"),
        expect.objectContaining({ method: "POST" }),
      );
      expect(res.status).toBe("CANCELLED");
    });

    it("[TC-CN-02] Lỗi 409 khi đơn đã được duyệt không thể hủy (LEAVE_REQUEST_NOT_CANCELLABLE)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "LEAVE_REQUEST_NOT_CANCELLABLE",
          message: "Chỉ có thể hủy đơn nghỉ phép đang chờ xử lý.",
        }),
      } as Response);

      await expect(leaveService.cancelLeaveRequest(42)).rejects.toMatchObject({
        code: "LEAVE_REQUEST_NOT_CANCELLABLE",
      });
    });

    it("[TC-CN-03] Lỗi 403 khi hủy đơn không phải của mình (LEAVE_REQUEST_NOT_OWNER)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "LEAVE_REQUEST_NOT_OWNER",
          message: "Bạn chỉ được hủy đơn nghỉ phép của chính mình.",
        }),
      } as Response);

      await expect(leaveService.cancelLeaveRequest(42)).rejects.toMatchObject({
        code: "LEAVE_REQUEST_NOT_OWNER",
      });
    });
  });
});

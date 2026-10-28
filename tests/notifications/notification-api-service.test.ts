import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock expo-secure-store before importing api/notification-service
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn().mockResolvedValue("mock-jwt-access-token"),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
}));

import { leaveService } from "@/services/leave-service";
import { notificationService } from "@/services/notification-service";

describe("Notification API Service (Đặc tả API HRM - QLNghiPhep Mục 40 - 44 & 49)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ==========================================
  // API 40: GET /api/v1/notifications?page={page}&size={size}
  // ==========================================
  describe("API 40: GET /api/v1/notifications", () => {
    it("[TC-NOTIF-API-40-01] Lấy danh sách thông báo thành công có phân trang (200 OK)", async () => {
      const mockList = {
        content: [
          {
            id: 101,
            type: "LEAVE_APPROVED",
            title: "Đơn nghỉ phép đã được duyệt",
            content: "Đơn NP000042 của bạn đã được duyệt.",
            relatedEntity: {
              type: "LEAVE_REQUEST",
              id: 42,
            },
            read: false,
            readAt: null,
            createdAt: "2026-10-16T09:00:00+07:00",
          },
          {
            id: 100,
            type: "LEAVE_REJECTED",
            title: "Đơn nghỉ phép bị từ chối",
            content: "Đơn NP000041 của bạn bị từ chối do trùng lịch trực ban.",
            relatedEntity: {
              type: "LEAVE_REQUEST",
              id: 41,
            },
            read: true,
            readAt: "2026-10-15T10:30:00+07:00",
            createdAt: "2026-10-15T10:00:00+07:00",
          },
        ],
        page: 0,
        size: 20,
        totalElements: 2,
        totalPages: 1,
        hasNext: false,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockList,
      } as Response);

      const res = await notificationService.getNotifications({
        page: 0,
        size: 20,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications?page=0&size=20"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-access-token",
          }),
        }),
      );
      expect(res.content).toHaveLength(2);
      expect(res.content[0].type).toBe("LEAVE_APPROVED");
      expect(res.content[0].read).toBe(false);
      expect(res.content[1].type).toBe("LEAVE_REJECTED");
      expect(res.content[1].read).toBe(true);
      expect(res.totalElements).toBe(2);
      expect(res.hasNext).toBe(false);
    });

    it("[TC-NOTIF-API-40-02] Lấy danh sách rỗng khi chưa có thông báo (200 OK)", async () => {
      const emptyList = {
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => emptyList,
      } as Response);

      const res = await notificationService.getNotifications();
      expect(res.content).toEqual([]);
      expect(res.totalElements).toBe(0);
      expect(res.hasNext).toBe(false);
    });

    it("[TC-NOTIF-API-40-03] Lỗi 400 khi tham số phân trang không hợp lệ (VALIDATION_ERROR)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "VALIDATION_ERROR",
          message:
            "Số trang không được nhỏ hơn 0 hoặc kích thước không hợp lệ.",
        }),
      } as Response);

      await expect(
        notificationService.getNotifications({ page: -1, size: 20 }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    });

    it("[TC-NOTIF-API-40-04] Lỗi 401 khi chưa đăng nhập hoặc token hết hạn (AUTH_UNAUTHORIZED)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "AUTH_UNAUTHORIZED",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        }),
      } as Response);

      await expect(
        notificationService.getNotifications({ page: 0, size: 20 }),
      ).rejects.toMatchObject({
        code: "AUTH_UNAUTHORIZED",
      });
    });
  });

  // ==========================================
  // API 41: GET /api/v1/notifications/unread-count
  // ==========================================
  describe("API 41: GET /api/v1/notifications/unread-count", () => {
    it("[TC-NOTIF-API-41-01] Lấy số thông báo chưa đọc thành công (200 OK)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ unreadCount: 3 }),
      } as Response);

      const res = await notificationService.getUnreadCount();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications/unread-count"),
        expect.objectContaining({ method: "GET" }),
      );
      expect(res.unreadCount).toBe(3);
    });

    it("[TC-NOTIF-API-41-02] Số lượng chưa đọc bằng 0 (200 OK)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ unreadCount: 0 }),
      } as Response);

      const res = await notificationService.getUnreadCount();
      expect(res.unreadCount).toBe(0);
    });

    it("[TC-NOTIF-API-41-03] Lỗi 401 khi token không hợp lệ (AUTH_UNAUTHORIZED)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "AUTH_UNAUTHORIZED",
          message: "Phiên đăng nhập đã hết hạn.",
        }),
      } as Response);

      await expect(notificationService.getUnreadCount()).rejects.toMatchObject({
        code: "AUTH_UNAUTHORIZED",
      });
    });
  });

  // ==========================================
  // API 42: GET /api/v1/notifications/{id}
  // ==========================================
  describe("API 42: GET /api/v1/notifications/{id}", () => {
    it("[TC-NOTIF-API-42-01] Xem chi tiết thông báo thành công (200 OK)", async () => {
      const mockDetail = {
        id: 101,
        type: "LEAVE_APPROVED",
        title: "Đơn nghỉ phép đã được duyệt",
        content: "Đơn NP000042 của bạn đã được duyệt.",
        relatedEntity: {
          type: "LEAVE_REQUEST",
          id: 42,
        },
        read: false,
        readAt: null,
        createdAt: "2026-10-16T09:00:00+07:00",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockDetail,
      } as Response);

      const res = await notificationService.getNotificationDetail(101);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications/101"),
        expect.objectContaining({ method: "GET" }),
      );
      expect(res.id).toBe(101);
      expect(res.relatedEntity?.id).toBe(42);
    });

    it("[TC-NOTIF-API-42-02] Lỗi 404 khi không tìm thấy thông báo (NOTIFICATION_NOT_FOUND)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "NOTIFICATION_NOT_FOUND",
          message: "Không tìm thấy thông báo.",
        }),
      } as Response);

      await expect(
        notificationService.getNotificationDetail(999),
      ).rejects.toMatchObject({
        code: "NOTIFICATION_NOT_FOUND",
      });
    });

    it("[TC-NOTIF-API-42-03] Lỗi 401 khi token không hợp lệ (AUTH_UNAUTHORIZED)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "AUTH_UNAUTHORIZED",
        }),
      } as Response);

      await expect(
        notificationService.getNotificationDetail(101),
      ).rejects.toMatchObject({
        code: "AUTH_UNAUTHORIZED",
      });
    });
  });

  // ==========================================
  // API 43: PATCH /api/v1/notifications/{id}/read
  // ==========================================
  describe("API 43: PATCH /api/v1/notifications/{id}/read", () => {
    it("[TC-NOTIF-API-43-01] Đánh dấu 1 thông báo đã đọc thành công (200 OK)", async () => {
      const mockReadItem = {
        id: 101,
        type: "LEAVE_APPROVED",
        title: "Đơn nghỉ phép đã được duyệt",
        content: "Đơn NP000042 của bạn đã được duyệt.",
        relatedEntity: {
          type: "LEAVE_REQUEST",
          id: 42,
        },
        read: true,
        readAt: "2026-10-16T09:05:00+07:00",
        createdAt: "2026-10-16T09:00:00+07:00",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockReadItem,
      } as Response);

      const res = await notificationService.markAsRead(101);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications/101/read"),
        expect.objectContaining({ method: "PATCH" }),
      );
      expect(res.id).toBe(101);
      expect(res.read).toBe(true);
      expect(res.readAt).toBe("2026-10-16T09:05:00+07:00");
    });

    it("[TC-NOTIF-API-43-02] Tính bất biến (Idempotent): Đánh dấu thông báo đã đọc trước đó vẫn trả 200 OK", async () => {
      const alreadyRead = {
        id: 101,
        type: "LEAVE_APPROVED",
        title: "Đơn nghỉ phép đã được duyệt",
        content: "Đơn NP000042 của bạn đã được duyệt.",
        relatedEntity: {
          type: "LEAVE_REQUEST",
          id: 42,
        },
        read: true,
        readAt: "2026-10-16T09:05:00+07:00",
        createdAt: "2026-10-16T09:00:00+07:00",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => alreadyRead,
      } as Response);

      const res = await notificationService.markAsRead(101);
      expect(res.read).toBe(true);
    });

    it("[TC-NOTIF-API-43-03] Lỗi 404 khi không tìm thấy thông báo để đánh dấu đọc (NOTIFICATION_NOT_FOUND)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "NOTIFICATION_NOT_FOUND",
          message: "Không tìm thấy thông báo.",
        }),
      } as Response);

      await expect(notificationService.markAsRead(999)).rejects.toMatchObject({
        code: "NOTIFICATION_NOT_FOUND",
      });
    });

    it("[TC-NOTIF-API-43-04] Lỗi 401 khi token không hợp lệ (AUTH_UNAUTHORIZED)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "AUTH_UNAUTHORIZED",
        }),
      } as Response);

      await expect(notificationService.markAsRead(101)).rejects.toMatchObject({
        code: "AUTH_UNAUTHORIZED",
      });
    });
  });

  // ==========================================
  // API 44: PATCH /api/v1/notifications/read-all
  // ==========================================
  describe("API 44: PATCH /api/v1/notifications/read-all", () => {
    it("[TC-NOTIF-API-44-01] Đánh dấu tất cả thông báo đã đọc thành công (200 OK)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ unreadCount: 0 }),
      } as Response);

      const res = await notificationService.markAllAsRead();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/notifications/read-all"),
        expect.objectContaining({ method: "PATCH" }),
      );
      expect(res.unreadCount).toBe(0);
    });

    it("[TC-NOTIF-API-44-02] Tính bất biến (Idempotent): Đánh dấu tất cả khi unreadCount = 0 vẫn trả 200 OK", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ unreadCount: 0 }),
      } as Response);

      const res = await notificationService.markAllAsRead();
      expect(res.unreadCount).toBe(0);
    });

    it("[TC-NOTIF-API-44-03] Lỗi 401 khi token không hợp lệ (AUTH_UNAUTHORIZED)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "AUTH_UNAUTHORIZED",
        }),
      } as Response);

      await expect(notificationService.markAllAsRead()).rejects.toMatchObject({
        code: "AUTH_UNAUTHORIZED",
      });
    });
  });

  // ==========================================
  // Liên kết API 49: GET /api/v1/leave-requests/{id} từ relatedEntity.id
  // ==========================================
  describe("Liên kết API 49: GET /api/v1/leave-requests/{id}", () => {
    it("[TC-NOTIF-API-49-01] Tải chi tiết đơn nghỉ phép đã duyệt từ thông báo LEAVE_APPROVED (200 OK)", async () => {
      const mockApprovedLeave = {
        id: 42,
        requestCode: "NP000042",
        employeeId: 1,
        employeeCode: "NV001",
        employeeName: "Nguyễn Văn A",
        leaveTypeId: 1,
        leaveTypeCode: "ANNUAL",
        leaveTypeName: "Nghỉ phép năm",
        startDate: "2026-10-20",
        endDate: "2026-10-21",
        requestedDays: 2,
        reason: "Nghỉ phép việc gia đình",
        status: "APPROVED" as const,
        reviewedByEmployeeId: 10,
        reviewedAt: "2026-10-16T09:00:00+07:00",
        rejectionReason: null,
        cancelledAt: null,
        createdAt: "2026-10-15T08:00:00+07:00",
        updatedAt: "2026-10-16T09:00:00+07:00",
        statusHistory: [
          {
            oldStatus: "PENDING" as const,
            newStatus: "APPROVED" as const,
            changedByEmployeeId: 10,
            changedByEmployeeName: "Trần Quản Lý",
            changedAt: "2026-10-16T09:00:00+07:00",
            note: "Duyệt đơn",
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockApprovedLeave,
      } as Response);

      const res = await leaveService.getLeaveRequestDetail(42);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/leave-requests/42"),
        expect.objectContaining({ method: "GET" }),
      );
      expect(res.status).toBe("APPROVED");
      expect(res.reviewedByEmployeeId).toBe(10);
      expect(res.statusHistory[0].changedByEmployeeName).toBe("Trần Quản Lý");
      expect(res.statusHistory).toHaveLength(1);
    });

    it("[TC-NOTIF-API-49-02] Tải chi tiết đơn nghỉ phép bị từ chối từ thông báo LEAVE_REJECTED (200 OK)", async () => {
      const mockRejectedLeave = {
        id: 41,
        requestCode: "NP000041",
        employeeId: 1,
        employeeCode: "NV001",
        employeeName: "Nguyễn Văn A",
        leaveTypeId: 1,
        leaveTypeCode: "ANNUAL",
        leaveTypeName: "Nghỉ phép năm",
        startDate: "2026-10-18",
        endDate: "2026-10-18",
        requestedDays: 1,
        reason: "Nghỉ việc cá nhân",
        status: "REJECTED" as const,
        reviewedByEmployeeId: 10,
        reviewedAt: "2026-10-15T10:00:00+07:00",
        rejectionReason: "Trùng lịch trực ban phòng ban, vui lòng đổi ngày.",
        cancelledAt: null,
        createdAt: "2026-10-14T08:00:00+07:00",
        updatedAt: "2026-10-15T10:00:00+07:00",
        statusHistory: [
          {
            oldStatus: "PENDING" as const,
            newStatus: "REJECTED" as const,
            changedByEmployeeId: 10,
            changedByEmployeeName: "Trần Quản Lý",
            changedAt: "2026-10-15T10:00:00+07:00",
            note: "Trùng lịch trực",
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockRejectedLeave,
      } as Response);

      const res = await leaveService.getLeaveRequestDetail(41);

      expect(res.status).toBe("REJECTED");
      expect(res.rejectionReason).toBe(
        "Trùng lịch trực ban phòng ban, vui lòng đổi ngày.",
      );
    });

    it("[TC-NOTIF-API-49-03] Lỗi 403 khi truy cập đơn ngoài phạm vi quyền (AUTH_FORBIDDEN_SCOPE)", async () => {
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
        leaveService.getLeaveRequestDetail(99),
      ).rejects.toMatchObject({
        code: "AUTH_FORBIDDEN_SCOPE",
      });
    });

    it("[TC-NOTIF-API-49-04] Lỗi 404 khi đơn liên kết không tồn tại (LEAVE_REQUEST_NOT_FOUND)", async () => {
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
  });
});

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock notificationService
vi.mock("@/services", () => ({
  notificationService: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    getNotificationDetail: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
  leaveService: {
    getLeaveRequestDetail: vi.fn(),
  },
}));

import { useNotifications } from "@/hooks/use-notifications";
import { notificationService } from "@/services";

describe("Lưu đồ Điều khiển Thông báo Mobile (notification-flow.drawio & UC020)", () => {
  const mockUnreadCountData = { unreadCount: 3 };

  const mockNotificationsPage0 = {
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
        content: "Đơn NP000041 của bạn bị từ chối.",
        relatedEntity: {
          type: "LEAVE_REQUEST",
          id: 41,
        },
        read: false,
        readAt: null,
        createdAt: "2026-10-15T10:00:00+07:00",
      },
      {
        id: 99,
        type: "SYSTEM_ANNOUNCEMENT",
        title: "Thông báo nghỉ lễ",
        content: "Công ty thông báo lịch nghỉ lễ Quốc khánh.",
        relatedEntity: null,
        read: false,
        readAt: null,
        createdAt: "2026-10-14T08:00:00+07:00",
      },
    ],
    page: 0,
    size: 20,
    totalElements: 5,
    totalPages: 2,
    hasNext: true,
  };

  const mockNotificationsPage1 = {
    content: [
      {
        id: 98,
        type: "LEAVE_APPROVED",
        title: "Đơn nghỉ phép đã được duyệt",
        content: "Đơn NP000039 của bạn đã được duyệt.",
        relatedEntity: {
          type: "LEAVE_REQUEST",
          id: 39,
        },
        read: true,
        readAt: "2026-10-10T11:00:00+07:00",
        createdAt: "2026-10-10T09:00:00+07:00",
      },
      {
        id: 97,
        type: "SYSTEM_ANNOUNCEMENT",
        title: "Khám sức khỏe định kỳ",
        content: "Lịch khám sức khỏe quý 4/2026.",
        relatedEntity: null,
        read: true,
        readAt: "2026-10-05T09:00:00+07:00",
        createdAt: "2026-10-05T08:00:00+07:00",
      },
    ],
    page: 1,
    size: 20,
    totalElements: 5,
    totalPages: 2,
    hasNext: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // GIAI ĐOẠN 1: ĐỒNG BỘ BADGE CHƯA ĐỌC & DANH SÁCH THÔNG BÁO (lane_phase1)
  // =========================================================================
  describe("Giai đoạn 1: Khởi tạo Badge & Danh sách thông báo (lane_phase1)", () => {
    it("[TC-FLOW-P1-01] Gọi Promise.allSettled tải song song unread-count và danh sách thông báo khi mount (p1_fetch -> p1_screen)", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue(
        mockUnreadCountData,
      );
      vi.mocked(notificationService.getNotifications).mockResolvedValue(
        mockNotificationsPage0,
      );

      const { result } = renderHook(() => useNotifications());

      // Loading initially
      expect(result.current.isListLoading).toBe(true);

      // Wait for async fetch
      await act(async () => {
        await Promise.resolve();
      });

      expect(notificationService.getUnreadCount).toHaveBeenCalledTimes(1);
      expect(notificationService.getNotifications).toHaveBeenCalledWith({
        page: 0,
        size: 20,
      });

      // Data populated
      expect(result.current.isListLoading).toBe(false);
      expect(result.current.unreadCount).toBe(3);
      expect(result.current.notifications).toHaveLength(3);
      expect(result.current.page).toBe(0);
      expect(result.current.totalElements).toBe(5);
      expect(result.current.hasNext).toBe(true);
      expect(result.current.listError).toBeNull();
    });

    it("[TC-FLOW-P1-02] Danh sách rỗng khi chưa có thông báo (p1_dec_empty -> p1_empty_state)", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        unreadCount: 0,
      });
      vi.mocked(notificationService.getNotifications).mockResolvedValue({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications).toEqual([]);
      expect(result.current.totalElements).toBe(0);
      expect(result.current.hasNext).toBe(false);
      expect(result.current.listError).toBeNull();
    });

    it("[TC-FLOW-P1-03] Xử lý lỗi cục bộ khi tải danh sách thất bại & Phục hồi bằng retryList (p1_err_partial -> retry)", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        unreadCount: 2,
      });
      vi.mocked(notificationService.getNotifications).mockRejectedValueOnce(
        new Error("Network Error"),
      );

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      // unreadCount still updated even if list fails (Promise.allSettled isolation)
      expect(result.current.unreadCount).toBe(2);
      expect(result.current.listError).toContain("Không thể tải");

      // Retry
      vi.mocked(notificationService.getNotifications).mockResolvedValueOnce(
        mockNotificationsPage0,
      );

      await act(async () => {
        await result.current.retryList();
      });

      expect(result.current.listError).toBeNull();
      expect(result.current.notifications).toHaveLength(3);
    });

    it("[TC-FLOW-P1-04] Phân trang onEndReached khi hasNext == true (p1_features: loadMore)", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue(
        mockUnreadCountData,
      );
      vi.mocked(notificationService.getNotifications)
        .mockResolvedValueOnce(mockNotificationsPage0)
        .mockResolvedValueOnce(mockNotificationsPage1);

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.page).toBe(0);
      expect(result.current.hasNext).toBe(true);
      expect(result.current.notifications).toHaveLength(3);

      // Trigger loadMore
      await act(async () => {
        await result.current.loadMore();
      });

      expect(notificationService.getNotifications).toHaveBeenCalledWith({
        page: 1,
        size: 20,
      });
      expect(result.current.page).toBe(1);
      expect(result.current.hasNext).toBe(false);
      expect(result.current.notifications).toHaveLength(5);
    });

    it("[TC-FLOW-P1-05] Không gọi loadMore khi hasNext == false", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        unreadCount: 0,
      });
      vi.mocked(notificationService.getNotifications).mockResolvedValue({
        ...mockNotificationsPage0,
        hasNext: false,
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.hasNext).toBe(false);
      vi.clearAllMocks();

      await act(async () => {
        await result.current.loadMore();
      });

      expect(notificationService.getNotifications).not.toHaveBeenCalled();
    });

    it("[TC-FLOW-P1-06] Kéo xuống làm mới (p1_features: Pull-to-Refresh)", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue(
        mockUnreadCountData,
      );
      vi.mocked(notificationService.getNotifications).mockResolvedValue(
        mockNotificationsPage0,
      );

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      // Update mock for refresh
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        unreadCount: 1,
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.unreadCount).toBe(1);
      expect(result.current.isRefreshing).toBe(false);
    });

    it("[TC-FLOW-P1-07] refreshUnreadCount cập nhật riêng số đếm cho Header Badge", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        unreadCount: 5,
      });
      vi.mocked(notificationService.getNotifications).mockResolvedValue(
        mockNotificationsPage0,
      );

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.unreadCount).toBe(5);

      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        unreadCount: 0,
      });

      await act(async () => {
        await result.current.refreshUnreadCount();
      });

      expect(result.current.unreadCount).toBe(0);
    });
  });

  // =========================================================================
  // GIAI ĐOẠN 2: ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC (lane_phase2)
  // =========================================================================
  describe("Giai đoạn 2: Luồng Đánh dấu tất cả đã đọc (lane_phase2)", () => {
    it("[TC-FLOW-P2-01] Bấm [Đọc tất cả] khi unreadCount > 0 thành công (p2_has_unread -> p2_api_read_all -> p2_success)", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        unreadCount: 2,
      });
      vi.mocked(notificationService.getNotifications).mockResolvedValue({
        ...mockNotificationsPage0,
        content: [
          { ...mockNotificationsPage0.content[0], read: false },
          { ...mockNotificationsPage0.content[1], read: false },
        ],
      });
      vi.mocked(notificationService.markAllAsRead).mockResolvedValue({
        unreadCount: 0,
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.unreadCount).toBe(2);
      expect(result.current.notifications.every((n) => !n.read)).toBe(true);

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(notificationService.markAllAsRead).toHaveBeenCalledTimes(1);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications.every((n) => n.read)).toBe(true);
      expect(result.current.isMarkingAllRead).toBe(false);
    });

    it("[TC-FLOW-P2-02] Chặn gọi API thừa khi unreadCount == 0 (p2_dec_unread -> p2_noop)", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        unreadCount: 0,
      });
      vi.mocked(notificationService.getNotifications).mockResolvedValue({
        ...mockNotificationsPage0,
        content: [
          { ...mockNotificationsPage0.content[0], read: true },
          { ...mockNotificationsPage0.content[1], read: true },
        ],
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.unreadCount).toBe(0);

      await act(async () => {
        await result.current.markAllAsRead();
      });

      // API must NOT be called when unreadCount is 0
      expect(notificationService.markAllAsRead).not.toHaveBeenCalled();
    });

    it("[TC-FLOW-P2-03] Xử lý lỗi khi gọi PATCH /notifications/read-all và mở khóa nút (p2_dec_res -> p2_err)", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        unreadCount: 3,
      });
      vi.mocked(notificationService.getNotifications).mockResolvedValue(
        mockNotificationsPage0,
      );
      vi.mocked(notificationService.markAllAsRead).mockRejectedValueOnce(
        new Error("Server 500"),
      );

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(result.current.isMarkingAllRead).toBe(false);
      expect(result.current.listError).toContain(
        "Không thể đánh dấu đọc tất cả",
      );
      // State should not be changed to read
      expect(result.current.unreadCount).toBe(3);
    });
  });

  // =========================================================================
  // GIAI ĐOẠN 3: ĐÁNH DẤU ĐỌC 1 BẢN GHI (lane_phase3: p3_dec_is_read -> p3_api_read_one)
  // =========================================================================
  describe("Giai đoạn 3: Đánh dấu đọc 1 bản ghi (lane_phase3)", () => {
    it("[TC-FLOW-P3-01] Chạm thông báo chưa đọc cập nhật optimistic và giảm unreadCount (p3_unread_yes -> p3_api_read_one)", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        unreadCount: 3,
      });
      vi.mocked(notificationService.getNotifications).mockResolvedValue(
        mockNotificationsPage0,
      );
      vi.mocked(notificationService.markAsRead).mockResolvedValue({
        ...mockNotificationsPage0.content[0],
        read: true,
        readAt: "2026-10-16T09:10:00+07:00",
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.unreadCount).toBe(3);
      expect(result.current.notifications[0].read).toBe(false);

      await act(async () => {
        await result.current.markOneAsRead(101);
      });

      expect(notificationService.markAsRead).toHaveBeenCalledWith(101);
      expect(result.current.unreadCount).toBe(2);
      expect(result.current.notifications[0].read).toBe(true);
    });

    it("[TC-FLOW-P3-02] Không giảm unreadCount xuống số âm khi đọc bản ghi", async () => {
      vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
        unreadCount: 0,
      });
      vi.mocked(notificationService.getNotifications).mockResolvedValue(
        mockNotificationsPage0,
      );
      vi.mocked(notificationService.markAsRead).mockResolvedValue({
        ...mockNotificationsPage0.content[0],
        read: true,
        readAt: "2026-10-16T09:10:00+07:00",
      });

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        await result.current.markOneAsRead(101);
      });

      expect(result.current.unreadCount).toBe(0);
    });

    it("[TC-FLOW-P3-03] Khi markOneAsRead gặp lỗi, tự động đối soát lại unreadCount từ server", async () => {
      vi.mocked(notificationService.getUnreadCount)
        .mockResolvedValueOnce({ unreadCount: 2 })
        .mockResolvedValueOnce({ unreadCount: 2 }); // Re-fetch on error
      vi.mocked(notificationService.getNotifications).mockResolvedValue(
        mockNotificationsPage0,
      );
      vi.mocked(notificationService.markAsRead).mockRejectedValueOnce(
        new Error("Network Error"),
      );

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        await result.current.markOneAsRead(101);
      });

      // Called refreshUnreadCount to re-sync
      expect(notificationService.getUnreadCount).toHaveBeenCalledTimes(2);
    });
  });
});

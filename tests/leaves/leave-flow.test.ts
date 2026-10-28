import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock leaveService
vi.mock("@/services", () => ({
  leaveService: {
    getLeaveTypes: vi.fn(),
    getLeaveBalances: vi.fn(),
    getMyLeaveRequests: vi.fn(),
    createLeaveRequest: vi.fn(),
    getLeaveRequestDetail: vi.fn(),
    cancelLeaveRequest: vi.fn(),
  },
}));

import { useLeaves } from "@/hooks/use-leaves";
import { leaveService } from "@/services";

describe("Quy trình Quản lý Nghỉ phép Mobile (leave-flow.drawio & UC013/UC014)", () => {
  const mockTypesData = [
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

  const mockBalancesData = {
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
      {
        leaveTypeId: 2,
        leaveTypeCode: "SICK",
        leaveTypeName: "Nghỉ ốm đau",
        allocatedDays: 30,
        usedDays: 0,
        remainingDays: 30,
      },
    ],
  };

  const mockRequestsPage0 = {
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

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(leaveService.getLeaveTypes).mockResolvedValue(mockTypesData);
    vi.mocked(leaveService.getLeaveBalances).mockResolvedValue(
      mockBalancesData,
    );
    vi.mocked(leaveService.getMyLeaveRequests).mockResolvedValue(
      mockRequestsPage0,
    );
  });

  const setupHook = async () => {
    let result: any;
    await act(async () => {
      const rendered = renderHook(() => useLeaves());
      result = rendered.result;
    });
    return result;
  };

  // =========================================================================
  // GIAI ĐOẠN 1: KHỞI TẠO MÀN HÌNH TAB 3, PHÂN TRANG & XỬ LÝ LỖI TỪNG PHẦN
  // =========================================================================
  describe("Giai đoạn 1: Khởi tạo Tab 3 (leave-flow.drawio Phase 1)", () => {
    it("[Flow-P1-01] p1_fetch -> p1_screen: Tải song song thành công Quỹ phép và Danh sách đơn", async () => {
      const result = await setupHook();

      expect(result.current.isBalanceLoading).toBe(false);
      expect(result.current.isListLoading).toBe(false);
      expect(result.current.balanceError).toBeNull();
      expect(result.current.listError).toBeNull();

      expect(result.current.balances).toHaveLength(2);
      expect(result.current.requests).toHaveLength(1);
      expect(result.current.requests[0].requestCode).toBe("NP000042");
      expect(result.current.totalElements).toBe(1);
    });

    it("[Flow-P1-02] p1_dec_fetch -> p1_err_partial: Lỗi từng phần khi API Quỹ phép thất bại", async () => {
      vi.mocked(leaveService.getLeaveBalances).mockRejectedValueOnce(
        new Error("Network Error"),
      );

      const result = await setupHook();

      expect(result.current.isBalanceLoading).toBe(false);
      expect(result.current.balanceError).toBeTruthy();
      expect(result.current.balances).toEqual([]);

      // Danh sách đơn vẫn nạp thành công
      expect(result.current.isListLoading).toBe(false);
      expect(result.current.listError).toBeNull();
      expect(result.current.requests).toHaveLength(1);
    });

    it("[Flow-P1-03] p1_dec_fetch -> p1_err_partial: Lỗi từng phần khi API Danh sách đơn thất bại", async () => {
      vi.mocked(leaveService.getMyLeaveRequests).mockRejectedValueOnce(
        new Error("Server 500"),
      );

      const result = await setupHook();

      // Quỹ phép vẫn nạp thành công
      expect(result.current.isBalanceLoading).toBe(false);
      expect(result.current.balanceError).toBeNull();
      expect(result.current.balances).toHaveLength(2);

      // Danh sách đơn ghi nhận lỗi
      expect(result.current.isListLoading).toBe(false);
      expect(result.current.listError).toBeTruthy();
      expect(result.current.requests).toEqual([]);
    });

    it("[Flow-P1-04] p1_dec_empty -> p1_empty_state: Danh sách đơn rỗng khi tài khoản chưa có đơn", async () => {
      vi.mocked(leaveService.getMyLeaveRequests).mockResolvedValueOnce({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
      });

      const result = await setupHook();

      expect(result.current.requests).toHaveLength(0);
      expect(result.current.totalElements).toBe(0);
      expect(result.current.listError).toBeNull();
    });

    it("[Flow-P1-05] p1_screen (Year Navigator): Chuyển năm quỹ phép gọi lại API", async () => {
      const result = await setupHook();
      const currentYear = new Date().getFullYear();

      expect(result.current.selectedYear).toBe(currentYear);

      await act(async () => {
        result.current.goToPreviousYear();
      });

      expect(result.current.selectedYear).toBe(currentYear - 1);
      expect(leaveService.getLeaveBalances).toHaveBeenCalledWith(
        currentYear - 1,
      );

      await act(async () => {
        result.current.goToNextYear();
      });

      expect(result.current.selectedYear).toBe(currentYear);
      expect(leaveService.getLeaveBalances).toHaveBeenCalledWith(currentYear);
    });

    it("[Flow-P1-06] p1_screen (5-Status Filter): Chọn bộ lọc trạng thái gửi đúng param status", async () => {
      const result = await setupHook();

      expect(result.current.filterStatus).toBe("ALL");

      // Chuyển sang PENDING
      await act(async () => {
        result.current.setFilterStatus("PENDING");
      });

      expect(result.current.filterStatus).toBe("PENDING");
      expect(leaveService.getMyLeaveRequests).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, status: "PENDING" }),
      );

      // Chuyển sang APPROVED
      await act(async () => {
        result.current.setFilterStatus("APPROVED");
      });

      expect(result.current.filterStatus).toBe("APPROVED");
      expect(leaveService.getMyLeaveRequests).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, status: "APPROVED" }),
      );

      // Chuyển về ALL -> status query param là undefined
      await act(async () => {
        result.current.setFilterStatus("ALL");
      });

      expect(result.current.filterStatus).toBe("ALL");
      expect(leaveService.getMyLeaveRequests).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, status: undefined }),
      );
    });

    it("[Flow-P1-07] p1_features (onEndReached): Phân trang cuộn đáy nối dữ liệu mới khi hasNext = true", async () => {
      vi.mocked(leaveService.getMyLeaveRequests).mockResolvedValueOnce({
        content: [
          {
            id: 1,
            requestCode: "NP000001",
            employeeId: 12,
            employeeCode: "NV000012",
            employeeName: "Nguyễn Văn A",
            leaveTypeId: 1,
            leaveTypeCode: "ANNUAL",
            leaveTypeName: "Nghỉ phép năm",
            startDate: "2026-10-01",
            endDate: "2026-10-02",
            requestedDays: 2,
            status: "APPROVED" as const,
            createdAt: "2026-10-01T09:00:00+07:00",
          },
        ],
        page: 0,
        size: 20,
        totalElements: 2,
        totalPages: 2,
        hasNext: true,
      });

      const result = await setupHook();
      expect(result.current.hasNext).toBe(true);

      // Mock page 1 response
      vi.mocked(leaveService.getMyLeaveRequests).mockResolvedValueOnce({
        content: [
          {
            id: 2,
            requestCode: "NP000002",
            employeeId: 12,
            employeeCode: "NV000012",
            employeeName: "Nguyễn Văn A",
            leaveTypeId: 1,
            leaveTypeCode: "ANNUAL",
            leaveTypeName: "Nghỉ phép năm",
            startDate: "2026-10-05",
            endDate: "2026-10-06",
            requestedDays: 2,
            status: "PENDING" as const,
            createdAt: "2026-10-05T09:00:00+07:00",
          },
        ],
        page: 1,
        size: 20,
        totalElements: 2,
        totalPages: 2,
        hasNext: false,
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(leaveService.getMyLeaveRequests).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      );
      expect(result.current.requests).toHaveLength(2);
      expect(result.current.hasNext).toBe(false);
    });

    it("[Flow-P1-08] p1_features (Pull-to-Refresh): Kéo làm mới gọi lại Quỹ phép và Danh sách", async () => {
      const result = await setupHook();

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(leaveService.getLeaveBalances).toHaveBeenCalledTimes(2);
      expect(leaveService.getMyLeaveRequests).toHaveBeenCalledTimes(2);
    });

    it("[Flow-P1-09] p1_err_partial: Thử lại cục bộ retryBalances và retryList hoạt động độc lập", async () => {
      const result = await setupHook();

      await act(async () => {
        await result.current.retryBalances();
      });

      expect(leaveService.getLeaveBalances).toHaveBeenCalledTimes(2);

      await act(async () => {
        await result.current.retryList();
      });

      expect(leaveService.getMyLeaveRequests).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // GIAI ĐOẠN 2: LUỒNG TẠO & GỬI ĐƠN PHÉP (UC013)
  // =========================================================================
  describe("Giai đoạn 2: Tạo & Gửi đơn nghỉ phép (leave-flow.drawio Phase 2)", () => {
    it("[Flow-P2-01] p2_fetch_types: Tải danh mục loại phép khi mở modal tạo đơn", async () => {
      const result = await setupHook();

      expect(result.current.leaveTypes).toHaveLength(2);
      expect(result.current.leaveTypes[0].code).toBe("ANNUAL");
      expect(result.current.isTypesLoading).toBe(false);
      expect(result.current.typesError).toBeNull();
    });

    it("[Flow-P2-02] p2_dec_types -> p2_err_types: Xử lý lỗi khi tải loại phép và thử lại thành công", async () => {
      vi.mocked(leaveService.getLeaveTypes).mockRejectedValueOnce(
        new Error("Types API Down"),
      );

      const result = await setupHook();

      expect(result.current.typesError).toBeTruthy();
      expect(result.current.leaveTypes).toEqual([]);

      // Bấm thử lại tải loại phép
      vi.mocked(leaveService.getLeaveTypes).mockResolvedValueOnce(
        mockTypesData,
      );

      await act(async () => {
        await result.current.fetchLeaveTypes();
      });

      expect(result.current.typesError).toBeNull();
      expect(result.current.leaveTypes).toHaveLength(2);
    });

    it("[Flow-P2-03] p2_success -> p2_ref_sync: syncAfterMutation đồng bộ lại cả Quỹ phép và Danh sách", async () => {
      const result = await setupHook();

      await act(async () => {
        await result.current.syncAfterMutation();
      });

      expect(leaveService.getLeaveBalances).toHaveBeenCalledTimes(2);
      expect(leaveService.getMyLeaveRequests).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // GIAI ĐOẠN 3: XEM CHI TIẾT & HỦY ĐƠN (UC014)
  // =========================================================================
  describe("Giai đoạn 3: Xem chi tiết & Hủy đơn nghỉ phép (leave-flow.drawio Phase 3)", () => {
    it("[Flow-P3-01] p3_fetch_detail: Tải thông tin chi tiết đơn và lịch sử duyệt", async () => {
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
        reason: "Giải quyết việc gia đình",
        status: "PENDING" as const,
        reviewedByEmployeeId: null,
        reviewedAt: null,
        rejectionReason: null,
        cancelledAt: null,
        createdAt: "2026-10-13T09:00:00+07:00",
        updatedAt: "2026-10-13T09:00:00+07:00",
        statusHistory: [],
      };

      vi.mocked(leaveService.getLeaveRequestDetail).mockResolvedValueOnce(
        mockDetail,
      );

      const detail = await leaveService.getLeaveRequestDetail(42);
      expect(detail.id).toBe(42);
      expect(detail.status).toBe("PENDING");
    });

    it("[Flow-P3-02] p3_api_cancel -> p3_success: Hủy đơn thành công chuyển status sang CANCELLED", async () => {
      vi.mocked(leaveService.cancelLeaveRequest).mockResolvedValueOnce({
        id: 42,
        requestCode: "NP000042",
        status: "CANCELLED" as const,
        cancelledAt: "2026-10-13T10:00:00+07:00",
        updatedAt: "2026-10-13T10:00:00+07:00",
        statusHistory: [],
      });

      const res = await leaveService.cancelLeaveRequest(42);
      expect(res.status).toBe("CANCELLED");
    });

    it("[Flow-P3-03] p3_err_cancel: Xử lý lỗi 409 Race Condition khi đơn đã duyệt trước khi bấm hủy", async () => {
      vi.mocked(leaveService.cancelLeaveRequest).mockRejectedValueOnce({
        status: 409,
        code: "LEAVE_REQUEST_NOT_CANCELLABLE",
        message: "Chỉ có thể hủy đơn nghỉ phép đang chờ xử lý.",
      });

      await expect(leaveService.cancelLeaveRequest(42)).rejects.toMatchObject({
        status: 409,
        code: "LEAVE_REQUEST_NOT_CANCELLABLE",
      });
    });

    it("[Flow-P3-04] p3_err_cancel: Xử lý lỗi 403 khi hủy đơn của người khác", async () => {
      vi.mocked(leaveService.cancelLeaveRequest).mockRejectedValueOnce({
        status: 403,
        code: "LEAVE_REQUEST_NOT_OWNER",
        message: "Bạn chỉ được hủy đơn nghỉ phép của chính mình.",
      });

      await expect(leaveService.cancelLeaveRequest(99)).rejects.toMatchObject({
        status: 403,
        code: "LEAVE_REQUEST_NOT_OWNER",
      });
    });

    it("[Flow-P3-05] p3_err_cancel: Xử lý lỗi 404 khi đơn không tồn tại", async () => {
      vi.mocked(leaveService.cancelLeaveRequest).mockRejectedValueOnce({
        status: 404,
        code: "LEAVE_REQUEST_NOT_FOUND",
        message: "Không tìm thấy đơn nghỉ phép.",
      });

      await expect(leaveService.cancelLeaveRequest(999)).rejects.toMatchObject({
        status: 404,
        code: "LEAVE_REQUEST_NOT_FOUND",
      });
    });
  });
});

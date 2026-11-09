import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock payrollService
vi.mock("@/services", () => ({
  payrollService: {
    getMyPayslips: vi.fn(),
    getMyPayslipDetail: vi.fn(),
  },
}));

import { usePayroll, usePayslipDetail } from "@/hooks/use-payroll";
import { payrollService } from "@/services";

describe("Lưu đồ Điều khiển Phiếu lương Mobile (payroll-flow.drawio & UC019)", () => {
  const mockPayslipsPage0 = {
    content: [
      {
        payrollRunId: 88,
        year: 2026,
        month: 9,
        netSalary: 23100000,
        publishedAt: "2026-10-02T02:00:00Z",
      },
      {
        payrollRunId: 87,
        year: 2026,
        month: 8,
        netSalary: 22000000,
        publishedAt: "2026-09-02T02:00:00Z",
      },
    ],
    page: 0,
    size: 20,
    totalElements: 3,
    totalPages: 2,
    hasNext: true,
  };

  const mockPayslipsPage1 = {
    content: [
      {
        payrollRunId: 86,
        year: 2026,
        month: 7,
        netSalary: 21500000,
        publishedAt: "2026-08-02T02:00:00Z",
      },
    ],
    page: 1,
    size: 20,
    totalElements: 3,
    totalPages: 2,
    hasNext: false,
  };

  const mockDetailData = {
    payrollRunId: 88,
    period: {
      year: 2026,
      month: 9,
      isPeriodClosed: true,
    },
    publishedAt: "2026-10-02T02:00:00Z",
    employee: {
      id: 101,
      employeeCode: "NV00101",
      fullName: "Nguyễn Văn An",
      department: {
        id: 3,
        code: "IT",
        name: "Công nghệ thông tin",
      },
    },
    work: {
      standardWorkingDays: 22,
      standardMinutesPerDay: 480,
      paidMinutes: 10560,
      paidWorkingDays: 22,
    },
    amounts: {
      baseSalaryMonthly: 22000000,
      allowanceMonthly: 2200000,
      deductionMonthly: 1100000,
      earnedBaseSalary: 22000000,
      earnedAllowance: 2200000,
      earnedDeduction: 1100000,
      netSalary: 23100000,
    },
    salaryProfileId: 18,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // GIAI ĐOẠN 1: KHỞI TẠO TAB 4 & DANH SÁCH KỲ LƯƠNG ĐÃ CÔNG BỐ (lane_phase1)
  // =========================================================================
  describe("Giai đoạn 1: Danh sách kỳ lương cá nhân (lane_phase1 - P1T-265)", () => {
    it("[TC-FLOW-P1-01] Khởi tạo Tab 4 nạp danh sách kỳ lương khi mount (p1_start -> p1_fetch_l11 -> p1_list_screen)", async () => {
      vi.mocked(payrollService.getMyPayslips).mockResolvedValue(
        mockPayslipsPage0,
      );

      const { result } = renderHook(() => usePayroll());

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await Promise.resolve();
      });

      expect(payrollService.getMyPayslips).toHaveBeenCalledWith({
        page: 0,
        size: 20,
        year: undefined,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.payslips).toHaveLength(2);
      expect(result.current.page).toBe(0);
      expect(result.current.totalElements).toBe(3);
      expect(result.current.hasNext).toBe(true);
      expect(result.current.selectedPeriodId).toBe(88);
      expect(result.current.selectedPayslip?.netSalary).toBe(23100000);
      expect(result.current.error).toBeNull();
    });

    it("[TC-FLOW-P1-02] Xử lý trạng thái danh sách rỗng (p1_dec_empty -> p1_empty_state)", async () => {
      vi.mocked(payrollService.getMyPayslips).mockResolvedValue({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
      });

      const { result } = renderHook(() => usePayroll());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.payslips).toEqual([]);
      expect(result.current.totalElements).toBe(0);
      expect(result.current.selectedPeriodId).toBeNull();
      expect(result.current.selectedPayslip).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("[TC-FLOW-P1-03] Lọc theo năm tự động đặt lại page = 0 và nạp lại dữ liệu (Year Filter)", async () => {
      vi.mocked(payrollService.getMyPayslips).mockResolvedValue(
        mockPayslipsPage0,
      );

      const { result } = renderHook(() => usePayroll());

      await act(async () => {
        await Promise.resolve();
      });

      // Change year
      await act(async () => {
        result.current.setSelectedYear(2025);
      });

      expect(result.current.selectedYear).toBe(2025);
      expect(payrollService.getMyPayslips).toHaveBeenCalledWith({
        page: 0,
        size: 20,
        year: 2025,
      });
    });

    it("[TC-FLOW-P1-04] Phân trang onEndReached (loadMore) khi hasNext == true", async () => {
      vi.mocked(payrollService.getMyPayslips)
        .mockResolvedValueOnce(mockPayslipsPage0)
        .mockResolvedValueOnce(mockPayslipsPage1);

      const { result } = renderHook(() => usePayroll());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.page).toBe(0);
      expect(result.current.hasNext).toBe(true);
      expect(result.current.payslips).toHaveLength(2);

      await act(async () => {
        await result.current.loadMore();
      });

      expect(payrollService.getMyPayslips).toHaveBeenCalledWith({
        page: 1,
        size: 20,
        year: undefined,
      });
      expect(result.current.page).toBe(1);
      expect(result.current.hasNext).toBe(false);
      expect(result.current.payslips).toHaveLength(3);
    });

    it("[TC-FLOW-P1-05] Chặn gọi loadMore khi hasNext == false hoặc đang loading", async () => {
      vi.mocked(payrollService.getMyPayslips).mockResolvedValue({
        ...mockPayslipsPage0,
        hasNext: false,
      });

      const { result } = renderHook(() => usePayroll());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.hasNext).toBe(false);
      vi.clearAllMocks();

      await act(async () => {
        await result.current.loadMore();
      });

      expect(payrollService.getMyPayslips).not.toHaveBeenCalled();
    });

    it("[TC-FLOW-P1-06] Thao tác kéo làm mới (Pull-to-Refresh)", async () => {
      vi.mocked(payrollService.getMyPayslips).mockResolvedValue(
        mockPayslipsPage0,
      );

      const { result } = renderHook(() => usePayroll());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.payslips).toHaveLength(2);
    });

    it("[TC-FLOW-P1-07] Bật/tắt ẩn hiện số tiền (toggleAmountVisibility)", async () => {
      vi.mocked(payrollService.getMyPayslips).mockResolvedValue(
        mockPayslipsPage0,
      );

      const { result } = renderHook(() => usePayroll());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isAmountHidden).toBe(false);

      act(() => {
        result.current.toggleAmountVisibility();
      });
      expect(result.current.isAmountHidden).toBe(true);

      act(() => {
        result.current.toggleAmountVisibility();
      });
      expect(result.current.isAmountHidden).toBe(false);
    });

    it("[TC-FLOW-P1-08] Xử lý lỗi tải danh sách (p1_err_server) & phục hồi bằng retry", async () => {
      vi.mocked(payrollService.getMyPayslips).mockRejectedValueOnce(
        new Error("Network Error"),
      );

      const { result } = renderHook(() => usePayroll());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.error).toBeDefined();

      vi.mocked(payrollService.getMyPayslips).mockResolvedValueOnce(
        mockPayslipsPage0,
      );

      await act(async () => {
        await result.current.retry();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.payslips).toHaveLength(2);
    });

    it("[TC-FLOW-P1-09] Chọn kỳ lương (selectPeriod) cập nhật selectedPayslip", async () => {
      vi.mocked(payrollService.getMyPayslips).mockResolvedValue(
        mockPayslipsPage0,
      );

      const { result } = renderHook(() => usePayroll());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.selectedPeriodId).toBe(88);

      act(() => {
        result.current.selectPeriod(87);
      });

      expect(result.current.selectedPeriodId).toBe(87);
      expect(result.current.selectedPayslip?.payrollRunId).toBe(87);
      expect(result.current.selectedPayslip?.netSalary).toBe(22000000);
    });
  });

  // =========================================================================
  // GIAI ĐOẠN 2: CHI TIẾT PHIẾU LƯƠNG CÁ NHÂN (lane_phase2 - P1T-266)
  // =========================================================================
  describe("Giai đoạn 2: Chi tiết phiếu lương cá nhân (lane_phase2 - P1T-266)", () => {
    it("[TC-FLOW-P2-01] Nạp chi tiết phiếu lương thành công qua usePayslipDetail (p2_fetch_l12 -> p2_render_voucher)", async () => {
      vi.mocked(payrollService.getMyPayslipDetail).mockResolvedValue(
        mockDetailData,
      );

      const { result } = renderHook(() => usePayslipDetail(88));

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await Promise.resolve();
      });

      expect(payrollService.getMyPayslipDetail).toHaveBeenCalledWith(88);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.detail).toEqual(mockDetailData);
      expect(result.current.detail?.amounts.netSalary).toBe(23100000);
      expect(result.current.error).toBeNull();
      expect(result.current.errorCode).toBeNull();
    });

    it("[TC-FLOW-P2-02] Bắt lỗi khi mã kỳ lương không hợp lệ (null/NaN)", async () => {
      const { result } = renderHook(() => usePayslipDetail(null));

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.detail).toBeNull();
      expect(result.current.errorCode).toBe("INVALID_ID");
      expect(result.current.error).toBe("Mã kỳ lương không hợp lệ.");
    });

    it("[TC-FLOW-P2-03] Xử lý lỗi 404 PAYSLIP_NOT_AVAILABLE và ghi nhận errorCode chuẩn", async () => {
      const apiErr = {
        status: 404,
        code: "PAYSLIP_NOT_AVAILABLE",
        message: "Phiếu lương không khả dụng hoặc chưa được công bố.",
      };
      vi.mocked(payrollService.getMyPayslipDetail).mockRejectedValueOnce(
        apiErr,
      );

      const { result } = renderHook(() => usePayslipDetail(89));

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.detail).toBeNull();
      expect(result.current.errorCode).toBe("PAYSLIP_NOT_AVAILABLE");
      expect(result.current.error).toBe("Phiếu lương chưa khả dụng.");
    });

    it("[TC-FLOW-P2-04] Xử lý lỗi mạng / 500 khi nạp chi tiết và phục hồi bằng retry", async () => {
      vi.mocked(payrollService.getMyPayslipDetail).mockRejectedValueOnce(
        new Error("Server 500"),
      );

      const { result } = renderHook(() => usePayslipDetail(88));

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.error).toBeDefined();

      vi.mocked(payrollService.getMyPayslipDetail).mockResolvedValueOnce(
        mockDetailData,
      );

      await act(async () => {
        await result.current.retry();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.detail).toEqual(mockDetailData);
    });

    it("[TC-FLOW-P2-05] Kéo làm mới (refresh) chi tiết phiếu lương cập nhật snapshot mới", async () => {
      vi.mocked(payrollService.getMyPayslipDetail).mockResolvedValue(
        mockDetailData,
      );

      const { result } = renderHook(() => usePayslipDetail(88));

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.detail).toEqual(mockDetailData);
    });
  });
});

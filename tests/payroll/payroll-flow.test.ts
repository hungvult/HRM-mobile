import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/services", () => ({
  payrollService: {
    getMyPayslips: vi.fn(),
    getMyPayslipByPeriod: vi.fn(),
    getMyPayslipDetail: vi.fn(),
  },
}));
import { usePayroll, usePayslipDetail } from "@/hooks/use-payroll";
import { payrollService } from "@/services";
import { mockDetailData } from "./fixtures";
import { PayslipDetail } from "@/types/payroll";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 24));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("UC019: chọn tháng/năm và chi tiết trực tiếp", () => {
  it("mặc định tháng/năm hôm nay và không gọi API danh sách", async () => {
    vi.mocked(payrollService.getMyPayslipByPeriod).mockResolvedValue({
      ...mockDetailData,
      period: { year: 2026, month: 11 },
    });
    const { result } = renderHook(() => usePayroll());
    await act(async () => {
      await Promise.resolve();
    });
    expect(payrollService.getMyPayslipByPeriod).toHaveBeenCalledWith(2026, 11);
    expect(payrollService.getMyPayslips).not.toHaveBeenCalled();
    expect(result.current.detail?.amounts.netSalary).toBe(23100000);
    expect(result.current.selectedMonth).toBe(11);
    expect(result.current.selectedYear).toBe(2026);
  });

  it("đổi tháng và năm tải đúng kỳ, không dùng ID đợt lương làm tháng", async () => {
    vi.mocked(payrollService.getMyPayslipByPeriod).mockResolvedValue(
      mockDetailData,
    );
    const { result } = renderHook(() => usePayroll());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      result.current.setSelectedMonth(9);
      result.current.setSelectedYear(2025);
    });
    expect(payrollService.getMyPayslipByPeriod).toHaveBeenLastCalledWith(
      2025,
      9,
    );
  });

  it("xóa ngay tiền cũ khi đổi kỳ và loại phản hồi kỳ cũ đến sau", async () => {
    const old = deferred<PayslipDetail>();
    const newest = {
      ...mockDetailData,
      payrollRunId: 90,
      period: { year: 2026, month: 10 },
    };
    vi.mocked(payrollService.getMyPayslipByPeriod)
      .mockResolvedValueOnce(mockDetailData)
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce(newest);
    const { result } = renderHook(() => usePayroll());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      result.current.setSelectedMonth(9);
    });
    expect(result.current.detail).toBeNull();
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      result.current.setSelectedMonth(10);
    });
    await act(async () => {
      old.resolve(mockDetailData);
    });
    expect(result.current.detail).toEqual(newest);
  });

  it("lỗi request cũ không che phiếu mới; lỗi kỳ mới không giữ tiền cũ", async () => {
    const old = deferred<PayslipDetail>();
    vi.mocked(payrollService.getMyPayslipByPeriod)
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce(mockDetailData)
      .mockRejectedValueOnce({ code: "PAYSLIP_NOT_AVAILABLE" });
    const { result } = renderHook(() => usePayroll());
    await act(async () => {
      result.current.setSelectedMonth(9);
    });
    await act(async () => {
      old.reject(new Error("old network error"));
    });
    expect(result.current.error).toBeNull();
    await act(async () => {
      result.current.setSelectedMonth(10);
    });
    expect(result.current.detail).toBeNull();
    expect(result.current.errorCode).toBe("PAYSLIP_NOT_AVAILABLE");
    expect(result.current.error).toContain("chưa được công bố");
  });

  it.each([
    ["PAYSLIP_NOT_FOUND", "Chưa có phiếu lương"],
    ["PAYSLIP_NOT_AVAILABLE", "chưa được công bố"],
  ])("phân biệt lỗi %s", async (code, message) => {
    vi.mocked(payrollService.getMyPayslipByPeriod).mockRejectedValue({ code });
    const { result } = renderHook(() => usePayroll());
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.detail).toBeNull();
    expect(result.current.errorCode).toBe(code);
    expect(result.current.availability).toBe(
      code === "PAYSLIP_NOT_FOUND" ? "not-found" : "not-published",
    );
    expect(result.current.error).toContain(message);
  });

  it("tải lại đúng kỳ và giữ lựa chọn che tiền khi đổi kỳ", async () => {
    vi.mocked(payrollService.getMyPayslipByPeriod).mockResolvedValue(
      mockDetailData,
    );
    const { result } = renderHook(() => usePayroll());
    await act(async () => {
      await Promise.resolve();
    });
    act(() => result.current.toggleAmountVisibility());
    await act(async () => {
      result.current.setSelectedMonth(9);
    });
    await act(async () => {
      await result.current.refresh();
    });
    expect(payrollService.getMyPayslipByPeriod).toHaveBeenLastCalledWith(
      2026,
      9,
    );
    expect(result.current.isAmountHidden).toBe(true);
    expect(result.current.isRefreshing).toBe(false);
  });

  it("retry sau lỗi không tự lấy kỳ khác và không tự retry API", async () => {
    vi.mocked(payrollService.getMyPayslipByPeriod)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(mockDetailData);
    const { result } = renderHook(() => usePayroll());
    await act(async () => {
      await Promise.resolve();
    });
    expect(payrollService.getMyPayslipByPeriod).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.detail).toEqual(mockDetailData);
  });

  it("deep link đổi runId không nhận snapshot request cũ", async () => {
    const old = deferred<PayslipDetail>();
    vi.mocked(payrollService.getMyPayslipDetail)
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce({ ...mockDetailData, payrollRunId: 90 });
    const { result, rerender } = renderHook(({ id }) => usePayslipDetail(id), {
      initialProps: { id: 88 },
    });
    await act(async () => {
      rerender({ id: 90 });
    });
    await act(async () => {
      old.resolve(mockDetailData);
    });
    expect(result.current.detail?.payrollRunId).toBe(90);
  });

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
      expect(result.current.availability).toBe("unavailable");
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

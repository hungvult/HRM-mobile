import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock expo-secure-store before importing api/payroll-service
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn().mockResolvedValue("mock-jwt-access-token"),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
}));

import { payrollService } from "@/services/payroll-service";

describe("Payroll API Service (Đặc tả API HRM - Lương Mục L11 & L12)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ==========================================
  // API L11: GET /api/v1/payroll/my-payslips
  // ==========================================
  describe("API L11: GET /api/v1/payroll/my-payslips (Danh sách kỳ lương cá nhân)", () => {
    it("[TC-API-11-01] Lấy danh sách kỳ lương đã công bố thành công (200 OK)", async () => {
      const mockPayslipsResponse = {
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
        totalElements: 2,
        totalPages: 1,
        hasNext: false,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockPayslipsResponse,
      } as Response);

      const res = await payrollService.getMyPayslips({ page: 0, size: 20 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/payroll/my-payslips?page=0&size=20"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-access-token",
          }),
        }),
      );
      expect(res.content).toHaveLength(2);
      expect(res.content[0].payrollRunId).toBe(88);
      expect(res.content[0].year).toBe(2026);
      expect(res.content[0].month).toBe(9);
      expect(res.content[0].netSalary).toBe(23100000);
      expect(res.totalElements).toBe(2);
      expect(res.hasNext).toBe(false);
    });

    it("[TC-API-11-02] Lấy danh sách rỗng khi chưa có kỳ lương công bố nào (200 OK)", async () => {
      const emptyResponse = {
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
        json: async () => emptyResponse,
      } as Response);

      const res = await payrollService.getMyPayslips();

      expect(res.content).toEqual([]);
      expect(res.totalElements).toBe(0);
      expect(res.hasNext).toBe(false);
    });

    it("[TC-API-11-03] Lọc danh sách kỳ lương theo tham số year thành công", async () => {
      const mockFilteredResponse = {
        content: [
          {
            payrollRunId: 88,
            year: 2026,
            month: 9,
            netSalary: 23100000,
            publishedAt: "2026-10-02T02:00:00Z",
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
        json: async () => mockFilteredResponse,
      } as Response);

      const res = await payrollService.getMyPayslips({
        year: 2026,
        page: 0,
        size: 20,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("year=2026"),
        expect.anything(),
      );
      expect(res.content[0].year).toBe(2026);
    });

    it("[TC-API-11-04] Phân trang với tham số page và size hợp lệ", async () => {
      const mockPagedResponse = {
        content: [
          {
            payrollRunId: 88,
            year: 2026,
            month: 9,
            netSalary: 23100000,
            publishedAt: "2026-10-02T02:00:00Z",
          },
        ],
        page: 1,
        size: 1,
        totalElements: 2,
        totalPages: 2,
        hasNext: false,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockPagedResponse,
      } as Response);

      const res = await payrollService.getMyPayslips({ page: 1, size: 1 });

      expect(res.page).toBe(1);
      expect(res.size).toBe(1);
      expect(res.totalElements).toBe(2);
      expect(res.hasNext).toBe(false);
    });

    it("[TC-API-11-05] Bắt lỗi 400 VALIDATION_ERROR khi truyền tham số không hợp lệ", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "VALIDATION_ERROR",
          message: "Tham số phân trang hoặc năm không hợp lệ.",
          errors: [{ field: "page", message: "Số trang không được âm." }],
        }),
      } as Response);

      await expect(
        payrollService.getMyPayslips({ page: -1, size: 20 }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    });

    it("[TC-API-11-06] Bắt lỗi 401 AUTH_UNAUTHORIZED khi thiếu hoặc sai token", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "AUTH_UNAUTHORIZED",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        }),
      } as Response);

      await expect(payrollService.getMyPayslips()).rejects.toMatchObject({
        code: "AUTH_UNAUTHORIZED",
      });
    });
  });

  // ==========================================
  // API L12: GET /api/v1/payroll/my-payslips/{payrollRunId}
  // ==========================================
  describe("API L12: GET /api/v1/payroll/my-payslips/{payrollRunId} (Chi tiết phiếu lương)", () => {
    it("[TC-API-12-01] Lấy chi tiết phiếu lương thành công cho kỳ đã công bố (200 OK)", async () => {
      const mockDetailResponse = {
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

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockDetailResponse,
      } as Response);

      const res = await payrollService.getMyPayslipDetail(88);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/payroll/my-payslips/88"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-jwt-access-token",
          }),
        }),
      );
      expect(res.payrollRunId).toBe(88);
      expect(res.period.year).toBe(2026);
      expect(res.period.month).toBe(9);
      expect(res.employee.fullName).toBe("Nguyễn Văn An");
      expect(res.work.paidWorkingDays).toBe(22);
      expect(res.amounts.netSalary).toBe(23100000);
      expect(res.amounts.earnedBaseSalary).toBe(22000000);
      expect(res.amounts.earnedAllowance).toBe(2200000);
      expect(res.amounts.earnedDeduction).toBe(1100000);
    });

    it("[TC-API-12-02] Bắt lỗi 404 PAYSLIP_NOT_AVAILABLE khi payrollRunId không tồn tại", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "PAYSLIP_NOT_AVAILABLE",
          message: "Phiếu lương không khả dụng hoặc chưa được công bố.",
        }),
      } as Response);

      await expect(
        payrollService.getMyPayslipDetail(999999),
      ).rejects.toMatchObject({
        code: "PAYSLIP_NOT_AVAILABLE",
      });
    });

    it("[TC-API-12-03] Bắt lỗi 404 PAYSLIP_NOT_AVAILABLE khi kỳ lương chưa công bố (GENERATED)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "PAYSLIP_NOT_AVAILABLE",
          message: "Phiếu lương chưa được công bố.",
        }),
      } as Response);

      await expect(payrollService.getMyPayslipDetail(89)).rejects.toMatchObject(
        {
          code: "PAYSLIP_NOT_AVAILABLE",
        },
      );
    });

    it("[TC-API-12-04] Bắt lỗi 404 PAYSLIP_NOT_AVAILABLE khi kỳ lương thuộc người khác (chống IDOR)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "PAYSLIP_NOT_AVAILABLE",
          message: "Phiếu lương không khả dụng.",
        }),
      } as Response);

      await expect(payrollService.getMyPayslipDetail(77)).rejects.toMatchObject(
        {
          code: "PAYSLIP_NOT_AVAILABLE",
        },
      );
    });

    it("[TC-API-12-05] Bắt lỗi 401 AUTH_UNAUTHORIZED khi thiếu hoặc sai token", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          code: "AUTH_UNAUTHORIZED",
          message: "Phiên đăng nhập đã hết hạn.",
        }),
      } as Response);

      await expect(payrollService.getMyPayslipDetail(88)).rejects.toMatchObject(
        {
          code: "AUTH_UNAUTHORIZED",
        },
      );
    });
  });
});

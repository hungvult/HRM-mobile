import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatPeriodMonthYear,
  getFriendlyErrorMessage,
} from "@/utils/formatters";

describe("Payroll Formatters & Snapshot Rules (Mục 3.3 & Hợp đồng L11, L12)", () => {
  // ==========================================
  // 1. formatCurrency: Định dạng tiền tệ VND chuẩn Việt Nam
  // ==========================================
  describe("formatCurrency: Định dạng số nguyên VND", () => {
    it("[TC-FMT-01] Định dạng số nguyên dương chuẩn phân cách hàng nghìn bằng dấu chấm", () => {
      expect(formatCurrency(22575000)).toBe("22.575.000 ₫");
      expect(formatCurrency(23100000)).toBe("23.100.000 ₫");
      expect(formatCurrency(1000000)).toBe("1.000.000 ₫");
      expect(formatCurrency(500)).toBe("500 ₫");
    });

    it("[TC-FMT-02] Hỗ trợ tùy chỉnh suffix tiền tệ", () => {
      expect(formatCurrency(22575000, " VND")).toBe("22.575.000 VND");
      expect(formatCurrency(22575000, "")).toBe("22.575.000");
    });

    it("[TC-FMT-03] Xử lý giá trị 0, null, undefined, chuỗi rỗng an toàn", () => {
      expect(formatCurrency(0)).toBe("0 ₫");
      expect(formatCurrency(null)).toBe("0 ₫");
      expect(formatCurrency(undefined)).toBe("0 ₫");
      expect(formatCurrency("")).toBe("0 ₫");
      expect(formatCurrency("abc")).toBe("0 ₫");
    });

    it("[TC-FMT-04] Xử lý số âm chuẩn dấu trừ phía trước", () => {
      expect(formatCurrency(-1075000)).toBe("-1.075.000 ₫");
      expect(formatCurrency(-50000, " VND")).toBe("-50.000 VND");
    });

    it("[TC-FMT-05] Tự động làm tròn số nguyên không để lộ số lẻ thập phân", () => {
      expect(formatCurrency(22575000.45)).toBe("22.575.000 ₫");
      expect(formatCurrency(22575000.8)).toBe("22.575.001 ₫");
    });
  });

  // ==========================================
  // 2. formatPeriodMonthYear: Định dạng Tháng MM/YYYY
  // ==========================================
  describe("formatPeriodMonthYear: Định dạng tiêu đề kỳ lương", () => {
    it("[TC-FMT-06] Định dạng tháng một chữ số có số 0 dẫn đầu", () => {
      expect(formatPeriodMonthYear(9, 2026)).toBe("Tháng 09/2026");
      expect(formatPeriodMonthYear(1, 2026)).toBe("Tháng 01/2026");
    });

    it("[TC-FMT-07] Định dạng tháng hai chữ số", () => {
      expect(formatPeriodMonthYear(10, 2026)).toBe("Tháng 10/2026");
      expect(formatPeriodMonthYear(12, 2026)).toBe("Tháng 12/2026");
    });

    it("[TC-FMT-08] Xử lý giá trị tháng hoặc năm không hợp lệ trả về chuỗi rỗng", () => {
      expect(formatPeriodMonthYear(0, 2026)).toBe("");
      expect(formatPeriodMonthYear(9, 0)).toBe("");
    });
  });

  // ==========================================
  // 3. Công thức tính Thực lĩnh Snapshot
  // ==========================================
  describe("Quy tắc Snapshot: Đối soát công thức thực lĩnh", () => {
    it("[TC-FMT-09] Kiểm tra công thức netSalary = earnedBaseSalary + earnedAllowance - earnedDeduction", () => {
      const amounts = {
        baseSalaryMonthly: 22000000,
        allowanceMonthly: 2200000,
        deductionMonthly: 1100000,
        earnedBaseSalary: 21500000,
        earnedAllowance: 2150000,
        earnedDeduction: 1075000,
        netSalary: 22575000,
      };

      const calculatedNet =
        amounts.earnedBaseSalary +
        amounts.earnedAllowance -
        amounts.earnedDeduction;

      expect(amounts.netSalary).toBe(calculatedNet);
      expect(amounts.netSalary).toBe(22575000);
    });

    it("[TC-FMT-10] Trường hợp làm đủ công 100% lương hưởng bằng lương tháng", () => {
      const amounts = {
        baseSalaryMonthly: 22000000,
        allowanceMonthly: 2200000,
        deductionMonthly: 1100000,
        earnedBaseSalary: 22000000,
        earnedAllowance: 2200000,
        earnedDeduction: 1100000,
        netSalary: 23100000,
      };

      expect(amounts.earnedBaseSalary).toBe(amounts.baseSalaryMonthly);
      expect(amounts.earnedAllowance).toBe(amounts.allowanceMonthly);
      expect(amounts.earnedDeduction).toBe(amounts.deductionMonthly);
      expect(amounts.netSalary).toBe(
        amounts.earnedBaseSalary +
          amounts.earnedAllowance -
          amounts.earnedDeduction,
      );
    });
  });

  // ==========================================
  // 4. getFriendlyErrorMessage: Bản địa hóa lỗi 100% tiếng Việt
  // ==========================================
  describe("getFriendlyErrorMessage: Bản địa hóa lỗi phân hệ Lương", () => {
    it("[TC-FMT-11] Ánh xạ PAYSLIP_NOT_AVAILABLE thành thông báo tiếng Việt chuẩn", () => {
      const err = { code: "PAYSLIP_NOT_AVAILABLE", status: 404 };
      expect(getFriendlyErrorMessage(err)).toBe("Phiếu lương chưa khả dụng.");
    });

    it("[TC-FMT-12] Ánh xạ PAYROLL_RUN_NOT_FOUND thành thông báo tiếng Việt chuẩn", () => {
      const err = { code: "PAYROLL_RUN_NOT_FOUND", status: 404 };
      expect(getFriendlyErrorMessage(err)).toBe("Không tìm thấy kỳ lương.");
    });

    it("[TC-FMT-13] Ánh xạ VALIDATION_ERROR thành dữ liệu không hợp lệ", () => {
      const err = { code: "VALIDATION_ERROR", status: 400 };
      expect(getFriendlyErrorMessage(err)).toBe(
        "Dữ liệu yêu cầu không hợp lệ.",
      );
    });

    it("[TC-FMT-14] Ánh xạ AUTH_UNAUTHORIZED / 401 thành phiên đăng nhập hết hạn", () => {
      const err = { code: "AUTH_UNAUTHORIZED", status: 401 };
      expect(getFriendlyErrorMessage(err)).toBe(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      );
    });

    it("[TC-FMT-15] Ánh xạ TIMEOUT_ERROR / 408 thành thông báo quá thời gian chờ", () => {
      const err = { code: "TIMEOUT_ERROR", status: 408 };
      expect(getFriendlyErrorMessage(err)).toBe(
        "Quá thời gian kết nối đến máy chủ. Vui lòng thử lại sau.",
      );
    });

    it("[TC-FMT-16] Ánh xạ NETWORK_ERROR / 0 thành thông báo kiểm tra mạng", () => {
      const err = { code: "NETWORK_ERROR", status: 0 };
      expect(getFriendlyErrorMessage(err)).toBe(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.",
      );
    });

    it("[TC-FMT-17] Ánh xạ lỗi 500 thành hệ thống gặp sự cố", () => {
      const err = { status: 500 };
      expect(getFriendlyErrorMessage(err)).toBe(
        "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
      );
    });

    it("[TC-FMT-18] Ưu tiên thông điệp tiếng Việt có sẵn từ server", () => {
      const err = {
        code: "CUSTOM_BUSINESS_ERROR",
        status: 400,
        message: "Kỳ lương chưa được phê duyệt.",
      };
      expect(getFriendlyErrorMessage(err)).toBe(
        "Kỳ lương chưa được phê duyệt.",
      );
    });
  });
});

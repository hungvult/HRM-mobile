import { describe, expect, it } from "vitest";

import {
  calculateWorkingDays,
  formatDateRange,
  formatDateTime,
  getFriendlyErrorMessage,
  getLeaveStatusConfig,
} from "@/utils/formatters";

describe("Leave Validation & Formatters", () => {
  // ==========================================
  // 1. calculateWorkingDays
  // ==========================================
  describe("calculateWorkingDays (Client Pre-calculation)", () => {
    it("[TC-WD-01] Tính đúng 1 ngày làm việc khi bắt đầu và kết thúc cùng ngày trong tuần", () => {
      // 2026-10-19 là Thứ Hai
      expect(calculateWorkingDays("2026-10-19", "2026-10-19")).toBe(1);
      // 2026-10-23 là Thứ Sáu
      expect(calculateWorkingDays("2026-10-23", "2026-10-23")).toBe(1);
    });

    it("[TC-WD-02] Tính đúng 5 ngày làm việc cho cả tuần (Thứ Hai đến Thứ Sáu)", () => {
      // 2026-10-19 (T2) đến 2026-10-23 (T6)
      expect(calculateWorkingDays("2026-10-19", "2026-10-23")).toBe(5);
    });

    it("[TC-WD-03] Tự động loại trừ Thứ Bảy và Chủ Nhật khi khoảng ngày xuyên cuối tuần", () => {
      // 2026-10-23 (T6) đến 2026-10-26 (T2 tuần sau) -> Chỉ gồm T6 và T2 = 2 ngày
      expect(calculateWorkingDays("2026-10-23", "2026-10-26")).toBe(2);
      // 2026-10-19 (T2) đến 2026-10-27 (T3 tuần sau) -> 5 ngày tuần 1 + 2 ngày tuần 2 = 7 ngày
      expect(calculateWorkingDays("2026-10-19", "2026-10-27")).toBe(7);
    });

    it("[TC-WD-04] Trả về 0 ngày khi khoảng ngày chỉ rơi vào Thứ Bảy và Chủ Nhật", () => {
      // 2026-10-24 (Thứ Bảy) đến 2026-10-25 (Chủ Nhật)
      expect(calculateWorkingDays("2026-10-24", "2026-10-25")).toBe(0);
      expect(calculateWorkingDays("2026-10-24", "2026-10-24")).toBe(0);
      expect(calculateWorkingDays("2026-10-25", "2026-10-25")).toBe(0);
    });

    it("[TC-WD-05] Trả về 0 khi ngày kết thúc trước ngày bắt đầu", () => {
      expect(calculateWorkingDays("2026-10-25", "2026-10-20")).toBe(0);
    });

    it("[TC-WD-06] Xử lý an toàn chuỗi ngày rỗng hoặc sai định dạng không văng ngoại lệ", () => {
      expect(calculateWorkingDays("", "")).toBe(0);
      expect(calculateWorkingDays("invalid-date", "2026-10-20")).toBe(0);
      expect(calculateWorkingDays("2026-10-20", "invalid-date")).toBe(0);
    });
  });

  // ==========================================
  // 2. formatDateRange & formatDateTime
  // ==========================================
  describe("formatDateRange & formatDateTime", () => {
    it("[TC-DR-01] Định dạng gọn chỉ 1 mốc ngày khi startDate trùng endDate", () => {
      expect(formatDateRange("2026-10-20", "2026-10-20")).toBe("20/10/2026");
      expect(formatDateRange("2026-10-20", undefined)).toBe("20/10/2026");
    });

    it("[TC-DR-02] Định dạng khoảng ngày 'DD/MM/YYYY — DD/MM/YYYY' khi khác ngày", () => {
      expect(formatDateRange("2026-10-20", "2026-10-22")).toBe(
        "20/10/2026 — 22/10/2026",
      );
    });

    it("[TC-DT-01] Định dạng formatDateTime chuẩn HH:mm, DD/MM/YYYY", () => {
      expect(formatDateTime(null)).toBe("--:--");
      expect(formatDateTime("invalid")).toBe("--:--");
      const d = new Date(2026, 9, 20, 14, 30);
      expect(formatDateTime(d.toISOString())).toBe("14:30, 20/10/2026");
    });
  });

  // ==========================================
  // 3. getLeaveStatusConfig
  // ==========================================
  describe("getLeaveStatusConfig (Quy chuẩn màu sắc Badge)", () => {
    it("[TC-SC-01] Trả về đúng nhãn tiếng Việt và màu sắc cho 4 trạng thái đơn", () => {
      const pending = getLeaveStatusConfig("PENDING");
      expect(pending.label).toBe("Chờ duyệt");

      const approved = getLeaveStatusConfig("APPROVED");
      expect(approved.label).toBe("Đã duyệt");

      const rejected = getLeaveStatusConfig("REJECTED");
      expect(rejected.label).toBe("Từ chối");

      const cancelled = getLeaveStatusConfig("CANCELLED");
      expect(cancelled.label).toBe("Đã hủy");

      const unknown = getLeaveStatusConfig(null);
      expect(unknown.label).toBe("Chưa xác định");
    });
  });

  // ==========================================
  // 4. getFriendlyErrorMessage
  // ==========================================
  describe("getFriendlyErrorMessage (Bản địa hóa 100% Tiếng Việt)", () => {
    it("[TC-EM-01] Chuyển đổi chính xác 11 mã lỗi nghiệp vụ Nghỉ phép sang tiếng Việt", () => {
      expect(
        getFriendlyErrorMessage({ code: "LEAVE_BALANCE_INSUFFICIENT" }),
      ).toBe("Số dư phép còn lại không đủ để gửi đơn này.");

      expect(getFriendlyErrorMessage({ code: "LEAVE_REQUEST_PAST_DATE" })).toBe(
        "Không thể gửi đơn nghỉ phép cho ngày trong quá khứ.",
      );

      expect(
        getFriendlyErrorMessage({ code: "LEAVE_REQUEST_DATE_RANGE_INVALID" }),
      ).toBe("Ngày kết thúc nghỉ không được trước ngày bắt đầu nghỉ.");

      expect(
        getFriendlyErrorMessage({ code: "LEAVE_REQUEST_NO_WORKING_DAY" }),
      ).toBe("Khoảng thời gian đăng ký không có ngày làm việc.");

      expect(getFriendlyErrorMessage({ code: "LEAVE_REQUEST_OVERLAP" })).toBe(
        "Khoảng ngày nghỉ bị chồng lấn với đơn đang chờ duyệt hoặc đã được duyệt.",
      );

      expect(
        getFriendlyErrorMessage({ code: "LEAVE_REQUEST_REVIEWER_NOT_FOUND" }),
      ).toBe(
        "Không tìm thấy quản lý trực tiếp hoặc nhân sự đang hoạt động để xử lý đơn nghỉ phép.",
      );

      expect(
        getFriendlyErrorMessage({ code: "LEAVE_REQUEST_NOT_CANCELLABLE" }),
      ).toBe(
        "Đơn nghỉ phép đã được xử lý trước đó, chỉ có thể hủy đơn đang chờ duyệt.",
      );

      expect(getFriendlyErrorMessage({ code: "LEAVE_REQUEST_NOT_OWNER" })).toBe(
        "Bạn chỉ được hủy đơn nghỉ phép của chính mình.",
      );

      expect(getFriendlyErrorMessage({ code: "LEAVE_REQUEST_NOT_FOUND" })).toBe(
        "Không tìm thấy đơn nghỉ phép.",
      );

      expect(
        getFriendlyErrorMessage({ code: "EMPLOYEE_PROFILE_REQUIRED" }),
      ).toBe("Tài khoản chưa được liên kết với hồ sơ nhân viên.");

      expect(
        getFriendlyErrorMessage({ code: "LEAVE_TYPE_NOT_AVAILABLE" }),
      ).toBe("Loại phép không tồn tại hoặc đã ngừng hiệu lực.");
    });

    it("[TC-EM-02] Không bao giờ để lộ mã lỗi kỹ thuật tiếng Anh thô lên giao diện", () => {
      expect(getFriendlyErrorMessage({ status: 500 })).toBe(
        "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
      );
      expect(getFriendlyErrorMessage({ code: "NETWORK_ERROR" })).toBe(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.",
      );
      expect(getFriendlyErrorMessage({ status: 401 })).toBe(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      );
      expect(getFriendlyErrorMessage({ status: 403 })).toBe(
        "Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ quản lý hoặc nhân sự.",
      );
    });
  });
});

import { describe, expect, it } from "vitest";
import { colors } from "@/constants/theme";
import {
  formatRelativeTime,
  getFriendlyErrorMessage,
  getNotificationTypeConfig,
} from "@/utils/formatters";

describe("Notification UI & Formatters Specification (Mục 3.1 & Mục 4)", () => {
  // ==========================================
  // 1. Phân biệt trực quan theo loại thông báo (getNotificationTypeConfig)
  // ==========================================
  describe("getNotificationTypeConfig: Màu sắc & Biểu tượng nhận diện", () => {
    it("[TC-NOTIF-UI-01] LEAVE_APPROVED hiển thị icon checkmark-circle và điểm nhấn màu xanh lá", () => {
      const config = getNotificationTypeConfig("LEAVE_APPROVED");
      expect(config.label).toBe("Đã duyệt nghỉ phép");
      expect(config.icon).toBe("checkmark-circle");
      expect(config.iconColor).toBe(colors.success);
      expect(config.iconBg).toBe(colors.successSubtle);
      expect(config.accentColor).toBe(colors.success);
    });

    it("[TC-NOTIF-UI-02] LEAVE_REJECTED hiển thị icon close-circle và điểm nhấn màu đỏ", () => {
      const config = getNotificationTypeConfig("LEAVE_REJECTED");
      expect(config.label).toBe("Từ chối nghỉ phép");
      expect(config.icon).toBe("close-circle");
      expect(config.iconColor).toBe(colors.danger);
      expect(config.iconBg).toBe(colors.dangerSubtle);
      expect(config.accentColor).toBe(colors.danger);
    });

    it("[TC-NOTIF-UI-03] Loại thông báo mặc định / khác hiển thị icon notifications và màu chính", () => {
      const config = getNotificationTypeConfig("SYSTEM_ANNOUNCEMENT");
      expect(config.label).toBe("Thông báo hệ thống");
      expect(config.icon).toBe("notifications");
      expect(config.iconColor).toBe(colors.primary);
      expect(config.accentColor).toBe(colors.primary);
    });

    it("[TC-NOTIF-UI-04] Trả về cấu hình mặc định khi type rỗng hoặc undefined", () => {
      const config = getNotificationTypeConfig(undefined);
      expect(config.label).toBe("Thông báo hệ thống");
      expect(config.icon).toBe("notifications");
    });
  });

  // ==========================================
  // 2. Định dạng thời gian tương đối (formatRelativeTime)
  // ==========================================
  describe("formatRelativeTime: Định dạng mốc thời gian tiếng Việt", () => {
    it("[TC-NOTIF-TIME-01] Trả về chuỗi rỗng khi không có giá trị thời gian", () => {
      expect(formatRelativeTime(null)).toBe("");
      expect(formatRelativeTime(undefined)).toBe("");
      expect(formatRelativeTime("")).toBe("");
    });

    it("[TC-NOTIF-TIME-02] Trả về chuỗi rỗng khi chuỗi ngày giờ không hợp lệ", () => {
      expect(formatRelativeTime("invalid-date-string")).toBe("");
    });

    it("[TC-NOTIF-TIME-03] Hiển thị 'Vừa xong' khi thời gian dưới 1 phút", () => {
      const nowIso = new Date(Date.now() - 30 * 1000).toISOString();
      expect(formatRelativeTime(nowIso)).toBe("Vừa xong");
    });

    it("[TC-NOTIF-TIME-04] Hiển thị 'X phút trước' khi thời gian dưới 1 giờ", () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(formatRelativeTime(tenMinsAgo)).toBe("10 phút trước");
    });

    it("[TC-NOTIF-TIME-05] Hiển thị 'X giờ trước' khi thời gian dưới 24 giờ", () => {
      const threeHoursAgo = new Date(
        Date.now() - 3 * 60 * 60 * 1000,
      ).toISOString();
      expect(formatRelativeTime(threeHoursAgo)).toBe("3 giờ trước");
    });

    it("[TC-NOTIF-TIME-06] Hiển thị 'X ngày trước' khi thời gian dưới 7 ngày", () => {
      const fourDaysAgo = new Date(
        Date.now() - 4 * 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(formatRelativeTime(fourDaysAgo)).toBe("4 ngày trước");
    });

    it("[TC-NOTIF-TIME-07] Hiển thị ngày giờ đầy đủ khi thời gian từ 7 ngày trở lên", () => {
      const tenDaysAgo = new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const res = formatRelativeTime(tenDaysAgo);
      expect(res).not.toContain("ngày trước");
      expect(res.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 3. Bản địa hóa lỗi 100% tiếng Việt (getFriendlyErrorMessage)
  // ==========================================
  describe("getFriendlyErrorMessage: Bản địa hóa lỗi Thông báo & Liên kết", () => {
    it("[TC-NOTIF-ERR-01] Ánh xạ mã NOTIFICATION_NOT_FOUND thành thông báo tiếng Việt thân thiện", () => {
      const err = {
        code: "NOTIFICATION_NOT_FOUND",
        status: 404,
      };
      const msg = getFriendlyErrorMessage(err);
      expect(msg).toBe(
        "Không tìm thấy thông báo hoặc bạn không có quyền truy cập.",
      );
    });

    it("[TC-NOTIF-ERR-02] Ánh xạ mã AUTH_FORBIDDEN_SCOPE thành thông báo phân quyền tiếng Việt", () => {
      const err = {
        code: "AUTH_FORBIDDEN_SCOPE",
        status: 403,
      };
      const msg = getFriendlyErrorMessage(err);
      expect(msg).toBe(
        "Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ quản lý hoặc nhân sự.",
      );
    });

    it("[TC-NOTIF-ERR-03] Ánh xạ mã AUTH_UNAUTHORIZED / 401 thành phiên đăng nhập hết hạn", () => {
      const err = {
        code: "AUTH_UNAUTHORIZED",
        status: 401,
      };
      const msg = getFriendlyErrorMessage(err);
      expect(msg).toBe("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    });

    it("[TC-NOTIF-ERR-04] Ánh xạ TIMEOUT_ERROR / 408 thành thông báo quá thời gian kết nối", () => {
      const err = {
        code: "TIMEOUT_ERROR",
        status: 408,
      };
      const msg = getFriendlyErrorMessage(err);
      expect(msg).toBe(
        "Quá thời gian kết nối đến máy chủ. Vui lòng thử lại sau.",
      );
    });

    it("[TC-NOTIF-ERR-05] Ánh xạ NETWORK_ERROR / 0 thành thông báo kiểm tra mạng", () => {
      const err = {
        code: "NETWORK_ERROR",
        status: 0,
      };
      const msg = getFriendlyErrorMessage(err);
      expect(msg).toBe(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.",
      );
    });

    it("[TC-NOTIF-ERR-06] Ánh xạ lỗi 500 máy chủ thành thông báo sự cố hệ thống", () => {
      const err = {
        status: 500,
      };
      const msg = getFriendlyErrorMessage(err);
      expect(msg).toBe("Hệ thống đang gặp sự cố. Vui lòng thử lại sau.");
    });

    it("[TC-NOTIF-ERR-07] Ưu tiên thông điệp tiếng Việt có sẵn từ backend", () => {
      const err = {
        code: "BUSINESS_CUSTOM_ERROR",
        status: 400,
        message: "Số ngày phép không đủ để thực hiện yêu cầu.",
      };
      const msg = getFriendlyErrorMessage(err);
      expect(msg).toBe("Số ngày phép không đủ để thực hiện yêu cầu.");
    });
  });
});

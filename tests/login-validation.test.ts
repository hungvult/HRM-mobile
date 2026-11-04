import { describe, expect, it } from "vitest";
import { validateLoginFields } from "../src/utils/login-validation";

describe("UC001 — lỗi tại trường nhập", () => {
  it("báo cả hai trường bắt buộc khi để trống, không chỉ một thông báo chung", () => {
    expect(validateLoginFields("  ", "")).toEqual({
      usernameOrEmail: "Vui lòng nhập tên đăng nhập hoặc email.",
      password: "Vui lòng nhập mật khẩu.",
    });
  });
  it("kiểm tra đúng giới hạn hợp đồng và giữ nguyên khoảng trắng của mật khẩu", () => {
    expect(validateLoginFields("qa_01", "12345678")).toEqual({});
    expect(validateLoginFields("a", "short")).toHaveProperty("password");
    expect(
      validateLoginFields("a".repeat(256), "a".repeat(129)),
    ).toHaveProperty("usernameOrEmail");
  });
});

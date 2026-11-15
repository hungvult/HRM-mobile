export type LoginFieldErrors = { usernameOrEmail?: string; password?: string };

// Kiểm tra hai trường từ form cùng lúc để UC001 hiển thị lỗi ngay tại từng ô và dừng trước khi gọi API.
export function validateLoginFields(
  identity: string,
  password: string,
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  if (!identity.trim())
    errors.usernameOrEmail = "Vui lòng nhập tên đăng nhập hoặc email.";
  else if (identity.trim().length < 3)
    errors.usernameOrEmail =
      "Tên đăng nhập hoặc email phải có ít nhất 3 ký tự.";
  else if (identity.trim().length > 255)
    errors.usernameOrEmail =
      "Tên đăng nhập hoặc email không được vượt quá 255 ký tự.";
  if (!password) errors.password = "Vui lòng nhập mật khẩu.";
  else if (password.length < 8)
    errors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
  else if (password.length > 128)
    errors.password = "Mật khẩu không được vượt quá 128 ký tự.";
  return errors;
}

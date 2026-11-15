import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ login: vi.fn(), alert: vi.fn() }));
vi.mock("@/hooks", () => ({ useAuth: () => ({ login: state.login }) }));
vi.mock("@/services", () => ({ ApiError: class ApiError extends Error {} }));
vi.mock("react-native-safe-area-context", () => ({ SafeAreaView: ({ children }: any) => <div>{children}</div> }));
vi.mock("react-native", () => {
  const Container = ({ children }: any) => <div>{children}</div>;
  return {
    View: Container, Text: Container, ScrollView: Container, KeyboardAvoidingView: Container,
    Platform: { OS: "android", Version: 36 }, StyleSheet: { create: (value: any) => value },
    Alert: { alert: state.alert },
    Pressable: ({ children, onPress, disabled, accessibilityRole, accessibilityState }: any) => <button onClick={onPress} disabled={disabled} role={accessibilityRole} aria-checked={accessibilityState?.checked}>{children}</button>,
  };
});
vi.mock("@/components", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  Input: ({ label, value, onChangeText, error }: any) => <label>{label}<input aria-label={label} value={value} onChange={(event) => onChangeText(event.target.value)} />{error && <span role="alert">{error}</span>}</label>,
  Button: ({ title, onPress, loading }: any) => <button onClick={onPress} disabled={loading}>{title}</button>,
}));
import { LoginScreen } from "@/screens/auth/login-screen";

beforeEach(() => { vi.clearAllMocks(); state.login.mockResolvedValue(undefined); });
afterEach(cleanup);

describe("UC001 — form đăng nhập theo SRS", () => {
  it("bỏ trống hai ô hiển thị hai lỗi tại trường và không gọi đăng nhập", () => {
    render(<LoginScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(state.login).not.toHaveBeenCalled();
  });
  it.each([false, true])("chuyển đúng lựa chọn ghi nhớ %s vào phiên, không thêm vào payload API", async (remember) => {
    render(<LoginScreen />);
    fireEvent.change(screen.getByLabelText("Tên đăng nhập hoặc Email"), { target: { value: "  qa_01  " } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "fixture-password" } });
    if (remember) fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await waitFor(() => expect(state.login).toHaveBeenCalledWith({ usernameOrEmail: "qa_01", password: "fixture-password", deviceInfo: "android 36" }, remember));
  });
  it("quên mật khẩu cung cấp hướng dẫn liên hệ quản trị viên", () => {
    render(<LoginScreen />);
    fireEvent.click(screen.getByRole("button", { name: "Quên mật khẩu?" }));
    expect(state.alert).toHaveBeenCalledWith("Quên mật khẩu?", "Vui lòng liên hệ quản trị viên để đặt lại mật khẩu.");
  });
});

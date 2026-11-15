import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ isAuthenticated: false, isLoading: false }));
vi.mock("@/hooks", () => ({ useAuth: () => auth }));
vi.mock("@/contexts/auth-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/contexts/user-context", () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/constants", () => ({ colors: { primary: "blue", bgApp: "white" } }));
vi.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("expo-router", () => {
  const Stack = Object.assign(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    {
      Protected: ({
        guard,
        children,
      }: {
        guard: boolean;
        children: React.ReactNode;
      }) => (guard ? children : null),
      Screen: ({ name }: { name: string }) => (
        <span data-testid="screen">{name}</span>
      ),
    },
  );
  return {
    Stack,
    Redirect: ({ href }: { href: string }) => (
      <span data-testid="redirect">{href}</span>
    ),
  };
});

import Index from "@/app/index";
import RootLayout from "@/app/_layout";
import EditProfileRoute from "@/app/(app)/edit-profile";

afterEach(cleanup);

describe("Điều hướng theo phiên đăng nhập", () => {
  it("UC005 chặn cả liên kết trực tiếp tới màn sửa hồ sơ Mobile", () => {
    render(<EditProfileRoute />);
    expect(screen.getByTestId("redirect").textContent).toBe(
      "/(app)/(tabs)/profile",
    );
  });
  it("route gốc luôn chọn trang login hoặc nhóm nghiệp vụ, không render trang trắng", () => {
    auth.isAuthenticated = false;
    const view = render(<Index />);
    expect(screen.getByTestId("redirect").textContent).toBe("/(auth)/login");
    auth.isAuthenticated = true;
    view.rerender(<Index />);
    expect(screen.getByTestId("redirect").textContent).toBe("/(app)");
  });

  it("root loại nhóm nghiệp vụ ngay khi trạng thái chuyển sang đăng xuất", () => {
    auth.isAuthenticated = true;
    const view = render(<RootLayout />);
    expect(screen.getByTestId("screen").textContent).toBe("(app)");
    auth.isAuthenticated = false;
    view.rerender(<RootLayout />);
    expect(screen.getByTestId("screen").textContent).toBe("(auth)");
  });
});

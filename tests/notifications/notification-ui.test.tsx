import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock(
  "react-native",
  async () => (await import("../payroll/mobile-ui-mock")).nativeUI,
);
vi.mock("react-native-safe-area-context", async () => ({
  SafeAreaView: (await import("../payroll/mobile-ui-mock")).nativeUI
    .SafeAreaView,
}));
vi.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("expo-router", () => ({ useRouter: () => navigation }));
vi.mock("@/services", () => ({
  notificationService: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    getNotificationDetail: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));
import { notificationService } from "@/services";
import { NotificationsScreen } from "@/screens/notifications/notifications-screen";
import { NotificationItem } from "@/types";
const item: NotificationItem = {
  id: 101,
  type: "LEAVE_APPROVED",
  title: "Thông báo duyệt đơn",
  content: "Nội dung thông báo đầy đủ",
  relatedEntity: { type: "LEAVE_REQUEST", id: 42 },
  read: false,
  readAt: null,
  createdAt: "2026-11-24T09:00:00Z",
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(notificationService.getNotifications).mockResolvedValue({
    content: [item],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    hasNext: false,
  });
  vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
    unreadCount: 1,
  });
  vi.mocked(notificationService.getNotificationDetail).mockResolvedValue(item);
  vi.mocked(notificationService.markAsRead).mockResolvedValue({
    ...item,
    read: true,
    readAt: "2026-11-24T09:01:00Z",
  });
  vi.mocked(notificationService.markAsUnread).mockResolvedValue(item);
});
afterEach(cleanup);

describe("UC020 UI", () => {
  it("thẻ có đơn liên quan vẫn mở nội dung; chưa đọc giữ nguyên, chỉ nút mới mở đúng entity ID", async () => {
    render(<NotificationsScreen />);
    const card = await screen.findByRole("button", {
      name: /Thông báo duyệt đơn.*chưa đọc/,
    });
    fireEvent.click(card);
    const modal = await screen.findByRole("dialog");
    await within(modal).findByText("Nội dung thông báo đầy đủ");
    await waitFor(() =>
      expect(
        (
          within(modal).getByRole("button", {
            name: "Đánh dấu chưa đọc",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
    expect(navigation.push).not.toHaveBeenCalled();
    fireEvent.click(
      within(modal).getByRole("button", { name: "Đánh dấu chưa đọc" }),
    );
    await within(modal).findByText("Chưa đọc");
    expect(notificationService.markAsRead).toHaveBeenCalledTimes(1);
    expect(notificationService.markAsUnread).toHaveBeenCalledWith(101);
    expect(
      screen.getByRole("button", { name: /Thông báo duyệt đơn.*chưa đọc/ }),
    ).toBeTruthy();
    fireEvent.click(
      within(modal).getByRole("button", { name: "Mở đơn nghỉ phép liên quan" }),
    );
    expect(navigation.push).toHaveBeenCalledWith({
      pathname: "/leave-detail",
      params: { id: "42" },
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

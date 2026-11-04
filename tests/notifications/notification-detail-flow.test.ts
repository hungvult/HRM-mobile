import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
import { useNotifications } from "@/hooks/use-notifications";
import { notificationService } from "@/services";
import { NotificationItem, NotificationListResponse } from "@/types";

const item: NotificationItem = {
  id: 101,
  type: "LEAVE_APPROVED",
  title: "Đơn đã duyệt",
  content: "Chi tiết đầy đủ",
  relatedEntity: { type: "LEAVE_REQUEST", id: 42 },
  read: false,
  readAt: null,
  createdAt: "2026-10-16T09:00:00+07:00",
};
const page: NotificationListResponse = {
  content: [item],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
  hasNext: false,
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(notificationService.getNotifications).mockResolvedValue(page);
  vi.mocked(notificationService.getUnreadCount).mockResolvedValue({
    unreadCount: 1,
  });
  vi.mocked(notificationService.getNotificationDetail).mockResolvedValue(item);
  vi.mocked(notificationService.markAsRead).mockResolvedValue({
    ...item,
    read: true,
    readAt: "2026-11-24T09:00:00Z",
  });
  vi.mocked(notificationService.markAsUnread).mockResolvedValue(item);
});
afterEach(cleanup);

describe("UC020: chi tiết, chưa đọc và chạy đồng thời", () => {
  it("GET chi tiết thành công trước khi PATCH đọc; GET lỗi không đổi trạng thái", async () => {
    const detail = deferred<NotificationItem>();
    vi.mocked(notificationService.getNotificationDetail).mockReturnValueOnce(
      detail.promise,
    );
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await Promise.resolve();
    });
    let opening!: Promise<void>;
    act(() => {
      opening = result.current.openDetail(item);
    });
    expect(result.current.detailModalVisible).toBe(true);
    expect(notificationService.markAsRead).not.toHaveBeenCalled();
    await act(async () => {
      detail.resolve(item);
      await opening;
    });
    expect(result.current.selectedNotification?.content).toBe(
      "Chi tiết đầy đủ",
    );
    expect(result.current.selectedNotification?.read).toBe(true);
    vi.mocked(notificationService.getNotificationDetail).mockRejectedValueOnce(
      new Error("offline"),
    );
    await act(async () => {
      await result.current.openDetail({ ...item, id: 102 });
    });
    expect(notificationService.markAsRead).toHaveBeenCalledTimes(1);
    expect(result.current.detailError).toBeTruthy();
  });

  it("chưa đọc giữ nguyên qua rerender/refresh; chỉ mở lại mới tự đọc", async () => {
    vi.mocked(notificationService.getUnreadCount)
      .mockResolvedValueOnce({ unreadCount: 1 })
      .mockResolvedValueOnce({ unreadCount: 0 })
      .mockResolvedValue({ unreadCount: 1 });
    const { result, rerender } = renderHook(() => useNotifications());
    await act(async () => {
      await result.current.openDetail(item);
    });
    await act(async () => {
      await result.current.markOneAsUnread(101);
    });
    rerender();
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.selectedNotification?.read).toBe(false);
    expect(result.current.notifications[0].read).toBe(false);
    expect(result.current.unreadCount).toBe(1);
    expect(notificationService.markAsRead).toHaveBeenCalledTimes(1);
    act(() => result.current.closeDetail());
    await act(async () => {
      await result.current.openDetail(item);
    });
    expect(notificationService.markAsRead).toHaveBeenCalledTimes(2);
  });

  it("badge lấy server, không trừ một khi bản ghi đã đọc hoặc số thay đổi từ bên khác", async () => {
    vi.mocked(notificationService.getUnreadCount)
      .mockResolvedValueOnce({ unreadCount: 8 })
      .mockResolvedValue({ unreadCount: 12 });
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.markOneAsRead(101);
    });
    expect(result.current.unreadCount).toBe(12);
  });

  it("PATCH chưa đọc lỗi giữ trạng thái đã xác nhận, báo lỗi và chỉ đồng bộ count", async () => {
    vi.mocked(notificationService.getNotifications).mockResolvedValue({
      ...page,
      content: [{ ...item, read: true }],
    });
    vi.mocked(notificationService.markAsUnread).mockRejectedValue(
      new Error("offline"),
    );
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.markOneAsUnread(101);
    });
    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.actionError).toContain("chưa đọc");
    expect(notificationService.markAsUnread).toHaveBeenCalledTimes(1);
    expect(notificationService.getUnreadCount).toHaveBeenCalledTimes(2);
  });

  it("đọc tất cả rồi chưa đọc chạy nối tiếp, không bị phản hồi GET cũ ghi đè", async () => {
    const all = deferred<{ unreadCount: number }>();
    const oldList = deferred<NotificationListResponse>();
    vi.mocked(notificationService.markAllAsRead).mockReturnValue(all.promise);
    vi.mocked(notificationService.getNotifications)
      .mockResolvedValueOnce(page)
      .mockReturnValueOnce(oldList.promise);
    vi.mocked(notificationService.getUnreadCount)
      .mockResolvedValueOnce({ unreadCount: 1 })
      .mockResolvedValueOnce({ unreadCount: 0 })
      .mockResolvedValue({ unreadCount: 1 });
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await Promise.resolve();
    });
    let reading!: Promise<void>;
    let unread!: Promise<NotificationItem | null>;
    let refreshing!: Promise<void>;
    await act(async () => {
      refreshing = result.current.refresh();
      reading = result.current.markAllAsRead();
      unread = result.current.markOneAsUnread(101);
    });
    expect(notificationService.markAsUnread).not.toHaveBeenCalled();
    await act(async () => {
      all.resolve({ unreadCount: 0 });
      await reading;
      await unread;
    });
    await act(async () => {
      oldList.resolve({ ...page, content: [{ ...item, read: true }] });
      await refreshing;
    });
    expect(result.current.notifications[0].read).toBe(false);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.isUpdatingRead).toBe(false);
  });

  it("hai lần đọc tất cả trong cùng tick chỉ gọi một PATCH", async () => {
    vi.mocked(notificationService.markAllAsRead).mockResolvedValue({
      unreadCount: 0,
    });
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      await Promise.all([
        result.current.markAllAsRead(),
        result.current.markAllAsRead(),
      ]);
    });
    expect(notificationService.markAllAsRead).toHaveBeenCalledTimes(1);
  });

  it("đổi/đóng chi tiết trước GET xong bỏ phản hồi cũ và không gọi PATCH đọc cũ", async () => {
    const old = deferred<NotificationItem>();
    vi.mocked(notificationService.getNotificationDetail)
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce({ ...item, id: 102, read: true });
    const { result } = renderHook(() => useNotifications());
    let opening!: Promise<void>;
    act(() => {
      opening = result.current.openDetail(item);
    });
    await act(async () => {
      await result.current.openDetail({ ...item, id: 102 });
    });
    await act(async () => {
      old.resolve(item);
      await opening;
    });
    expect(result.current.selectedNotification?.id).toBe(102);
    expect(notificationService.markAsRead).not.toHaveBeenCalled();
    const closed = deferred<NotificationItem>();
    vi.mocked(notificationService.getNotificationDetail).mockReturnValueOnce(
      closed.promise,
    );
    act(() => {
      opening = result.current.openDetail(item);
    });
    act(() => result.current.closeDetail());
    await act(async () => {
      closed.resolve(item);
      await opening;
    });
    expect(result.current.selectedNotification).toBeNull();
    expect(notificationService.markAsRead).not.toHaveBeenCalled();
  });
});

it("mở lại trong lúc PATCH chưa đọc đang chờ phải đọc sau PATCH đó, kể cả GET trả trạng thái cũ", async () => {
  const unread = deferred<NotificationItem>();
  vi.mocked(notificationService.markAsUnread).mockReturnValueOnce(
    unread.promise,
  );
  vi.mocked(notificationService.getNotificationDetail).mockResolvedValue({
    ...item,
    read: true,
  });
  const { result } = renderHook(() => useNotifications());
  await act(async () => {
    await Promise.resolve();
  });
  let marking!: Promise<NotificationItem | null>;
  let opening!: Promise<void>;
  await act(async () => {
    marking = result.current.markOneAsUnread(101);
  });
  await act(async () => {
    opening = result.current.openDetail(item);
  });
  expect(notificationService.markAsRead).not.toHaveBeenCalled();
  await act(async () => {
    unread.resolve(item);
    await marking;
    await opening;
  });
  expect(notificationService.markAsRead).toHaveBeenCalledWith(101);
  expect(result.current.selectedNotification?.read).toBe(true);
});

it("count GET cũ không ghi đè badge sau PATCH thành công", async () => {
  const oldCount = deferred<{ unreadCount: number }>();
  vi.mocked(notificationService.getUnreadCount)
    .mockResolvedValueOnce({ unreadCount: 2 })
    .mockReturnValueOnce(oldCount.promise)
    .mockResolvedValueOnce({ unreadCount: 7 });
  const { result } = renderHook(() => useNotifications());
  await act(async () => {
    await Promise.resolve();
  });
  let refreshing!: Promise<void>;
  act(() => {
    refreshing = result.current.refreshUnreadCount();
  });
  await act(async () => {
    await result.current.markOneAsRead(101);
  });
  await act(async () => {
    oldCount.resolve({ unreadCount: 99 });
    await refreshing;
  });
  expect(result.current.unreadCount).toBe(7);
});

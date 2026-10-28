import {
  GetNotificationsParams,
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from "../types";
import { request } from "./api";

export const notificationService = {
  /**
   * API 40: Lấy danh sách thông báo của người dùng hiện tại (sắp xếp mới nhất trước, có phân trang)
   * GET /api/v1/notifications?page={page}&size={size}
   */
  async getNotifications(
    params: GetNotificationsParams = {},
  ): Promise<NotificationListResponse> {
    const { page = 0, size = 20 } = params;
    return await request<NotificationListResponse>(
      `/notifications?page=${page}&size=${size}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  },

  /**
   * API 41: Lấy tổng số thông báo chưa đọc của người dùng hiện tại
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return await request<UnreadCountResponse>("/notifications/unread-count", {
      method: "GET",
      requiresAuth: true,
    });
  },

  /**
   * API 42: Lấy chi tiết một thông báo
   * GET /api/v1/notifications/{id}
   */
  async getNotificationDetail(id: number): Promise<NotificationItem> {
    return await request<NotificationItem>(`/notifications/${id}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  /**
   * API 43: Đánh dấu một thông báo là đã đọc
   * PATCH /api/v1/notifications/{id}/read
   */
  async markAsRead(id: number): Promise<NotificationItem> {
    return await request<NotificationItem>(`/notifications/${id}/read`, {
      method: "PATCH",
      requiresAuth: true,
    });
  },

  /**
   * API 44: Đánh dấu toàn bộ thông báo chưa đọc là đã đọc
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(): Promise<UnreadCountResponse> {
    return await request<UnreadCountResponse>("/notifications/read-all", {
      method: "PATCH",
      requiresAuth: true,
    });
  },
};

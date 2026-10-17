export type NotificationType = "LEAVE_APPROVED" | "LEAVE_REJECTED" | string;

export interface NotificationRelatedEntity {
  type: "LEAVE_REQUEST" | string;
  id: number;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  relatedEntity: NotificationRelatedEntity | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  content: NotificationItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface GetNotificationsParams {
  page?: number;
  size?: number;
}

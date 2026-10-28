import { useCallback, useEffect, useRef, useState } from "react";
import { notificationService } from "../services";
import { NotificationItem } from "../types";
import { getFriendlyErrorMessage } from "../utils";

export interface UseNotificationsReturn {
  unreadCount: number;
  notifications: NotificationItem[];
  page: number;
  totalElements: number;
  hasNext: boolean;
  isListLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  isMarkingAllRead: boolean;
  listError: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  retryList: () => Promise<void>;
  markOneAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);

  const [isListLoading, setIsListLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 1. Fetch only unread count (for bell badge sync)
  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (isMountedRef.current) {
        setUnreadCount(res.unreadCount ?? 0);
      }
    } catch {
      // Non-critical background failure, keep previous count
    }
  }, []);

  // 2. Fetch page of notifications
  const fetchNotificationList = useCallback(
    async (targetPage: number, isAppend = false) => {
      if (isAppend) {
        setIsLoadingMore(true);
      } else {
        setIsListLoading(true);
        setListError(null);
      }

      try {
        const res = await notificationService.getNotifications({
          page: targetPage,
          size: 20,
        });

        if (isMountedRef.current) {
          setPage(res.page);
          setTotalElements(res.totalElements);
          setHasNext(res.hasNext);

          setNotifications((prev) => {
            if (!isAppend) {
              return res.content || [];
            }
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems = (res.content || []).filter(
              (item) => !existingIds.has(item.id),
            );
            return [...prev, ...newItems];
          });
        }
      } catch (err: any) {
        if (isMountedRef.current && !isAppend) {
          setListError(
            getFriendlyErrorMessage(
              err,
              "Không thể tải danh sách thông báo. Vui lòng thử lại.",
            ),
          );
        }
      } finally {
        if (isMountedRef.current) {
          if (isAppend) {
            setIsLoadingMore(false);
          } else {
            setIsListLoading(false);
          }
        }
      }
    },
    [],
  );

  // 3. Initial load & pull-to-refresh: Promise.allSettled for both unreadCount and list
  const loadInitialData = useCallback(async () => {
    setIsListLoading(true);
    setListError(null);

    const [unreadRes, listRes] = await Promise.allSettled([
      notificationService.getUnreadCount(),
      notificationService.getNotifications({ page: 0, size: 20 }),
    ]);

    if (!isMountedRef.current) return;

    if (unreadRes.status === "fulfilled") {
      setUnreadCount(unreadRes.value.unreadCount ?? 0);
    }

    if (listRes.status === "fulfilled") {
      setNotifications(listRes.value.content || []);
      setPage(listRes.value.page);
      setTotalElements(listRes.value.totalElements);
      setHasNext(listRes.value.hasNext);
    } else {
      setListError(
        getFriendlyErrorMessage(
          listRes.reason,
          "Không thể tải danh sách thông báo. Vui lòng thử lại.",
        ),
      );
    }

    setIsListLoading(false);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Pull to refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [unreadRes, listRes] = await Promise.allSettled([
        notificationService.getUnreadCount(),
        notificationService.getNotifications({ page: 0, size: 20 }),
      ]);

      if (!isMountedRef.current) return;

      if (unreadRes.status === "fulfilled") {
        setUnreadCount(unreadRes.value.unreadCount ?? 0);
      }

      if (listRes.status === "fulfilled") {
        setNotifications(listRes.value.content || []);
        setPage(listRes.value.page);
        setTotalElements(listRes.value.totalElements);
        setHasNext(listRes.value.hasNext);
        setListError(null);
      } else {
        setListError(
          getFriendlyErrorMessage(
            listRes.reason,
            "Không thể tải danh sách thông báo. Vui lòng thử lại.",
          ),
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, []);

  const retryList = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (!hasNext || isLoadingMore || isListLoading) return;
    await fetchNotificationList(page + 1, true);
  }, [hasNext, isLoadingMore, isListLoading, page, fetchNotificationList]);

  // 4. Mark single notification as read
  const markOneAsRead = useCallback(
    async (id: number) => {
      // Optimistically update list & badge immediately
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                read: true,
                readAt: item.readAt || new Date().toISOString(),
              }
            : item,
        ),
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const updated = await notificationService.markAsRead(id);
        if (isMountedRef.current && updated) {
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, ...updated } : item,
            ),
          );
        }
      } catch {
        // Re-fetch accurate count on error
        refreshUnreadCount();
      }
    },
    [refreshUnreadCount],
  );

  // 5. Mark all as read with anti-double-submit lock
  const markAllAsRead = useCallback(async () => {
    if (unreadCount <= 0 || isMarkingAllRead) return;

    setIsMarkingAllRead(true);
    try {
      const res = await notificationService.markAllAsRead();
      if (isMountedRef.current) {
        setUnreadCount(res.unreadCount ?? 0);
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            read: true,
            readAt: item.readAt || new Date().toISOString(),
          })),
        );
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setListError(
          getFriendlyErrorMessage(
            err,
            "Không thể đánh dấu đọc tất cả. Vui lòng thử lại.",
          ),
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsMarkingAllRead(false);
      }
    }
  }, [unreadCount, isMarkingAllRead]);

  return {
    unreadCount,
    notifications,
    page,
    totalElements,
    hasNext,
    isListLoading,
    isRefreshing,
    isLoadingMore,
    isMarkingAllRead,
    listError,
    loadMore,
    refresh,
    retryList,
    markOneAsRead,
    markAllAsRead,
    refreshUnreadCount,
  };
}

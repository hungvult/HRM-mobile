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
  isUpdatingRead: boolean;
  listError: string | null;
  selectedNotification: NotificationItem | null;
  isDetailLoading: boolean;
  detailModalVisible: boolean;
  detailError: string | null;
  actionError: string | null;
  openDetail: (item: NotificationItem) => Promise<void>;
  closeDetail: () => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  retryList: () => Promise<void>;
  markOneAsRead: (id: number) => Promise<NotificationItem | null>;
  markOneAsUnread: (id: number) => Promise<NotificationItem | null>;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

/**
 * Tải danh sách/thông báo của người nhận trong phiên, chỉ gửi ID notifications cho service.
 * Mở chi tiết thành công mới đánh dấu đọc; chưa đọc chỉ đổi theo nút bấm, không có effect tự đọc lại.
 * Xếp các PATCH theo thứ tự bấm và đọc lại badge từ server; không cộng/trừ theo số phỏng đoán.
 * Request chung chặn phiên đã logout, các số thứ tự dưới đây chặn phản hồi cũ trong cùng màn hình.
 */
export function useNotifications(): UseNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [isUpdatingRead, setIsUpdatingRead] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const mounted = useRef(true);
  const listRequest = useRef(0);
  const countRequest = useRef(0);
  const detailRequest = useRef(0);
  const dataVersion = useRef(0);
  const mutationQueue = useRef<Promise<unknown>>(Promise.resolve());
  const pendingMutations = useRef(0);
  const allReadPending = useRef(false);
  const morePending = useRef(false);

  // Unmount loại quyền ghi UI của cả GET và PATCH đang chờ, không phục hồi màn đã đóng.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      listRequest.current++;
      countRequest.current++;
      detailRequest.current++;
    };
  }, []);

  /** Badge dùng số server trả; request cũ không được ghi đè kết quả sau một thao tác mới. */
  const refreshUnreadCount = useCallback(async () => {
    const id = ++countRequest.current;
    const version = dataVersion.current;
    try {
      const res = await notificationService.getUnreadCount();
      if (
        mounted.current &&
        id === countRequest.current &&
        version === dataVersion.current
      ) {
        setUnreadCount(res.unreadCount ?? 0);
      }
    } catch {
      // Lỗi đồng bộ nền giữ số đã biết; không tự đoán badge hoặc retry PATCH.
    }
  }, []);

  /** Nạp trang đầu/làm mới/phân trang; kết quả trước PATCH không được ghi lại trạng thái đọc cũ. */
  const fetchList = useCallback(
    async (
      targetPage = 0,
      mode: "initial" | "refresh" | "more" = "initial",
    ) => {
      const id = ++listRequest.current;
      const version = dataVersion.current;
      setListError(null);
      if (mode === "more") setIsLoadingMore(true);
      else if (mode === "refresh") setIsRefreshing(true);
      else setIsListLoading(true);
      try {
        const res = await notificationService.getNotifications({
          page: targetPage,
          size: 20,
        });
        if (
          !mounted.current ||
          id !== listRequest.current ||
          version !== dataVersion.current
        )
          return;
        setPage(res.page);
        setTotalElements(res.totalElements);
        setHasNext(res.hasNext);
        setNotifications((prev) => {
          if (mode !== "more") return res.content || [];
          const ids = new Set(prev.map((item) => item.id));
          return [
            ...prev,
            ...(res.content || []).filter((item) => !ids.has(item.id)),
          ];
        });
      } catch (err: unknown) {
        if (
          mounted.current &&
          id === listRequest.current &&
          version === dataVersion.current
        ) {
          setListError(
            getFriendlyErrorMessage(
              err,
              "Không thể tải danh sách thông báo. Vui lòng thử lại.",
            ),
          );
        }
      } finally {
        if (mounted.current && id === listRequest.current) {
          setIsListLoading(false);
          setIsRefreshing(false);
          setIsLoadingMore(false);
        }
        if (mode === "more") morePending.current = false;
      }
    },
    [],
  );

  /** Tải danh sách và badge độc lập; lỗi một API không làm mất kết quả API còn lại. */
  const loadInitialData = useCallback(async () => {
    await Promise.allSettled([refreshUnreadCount(), fetchList()]);
  }, [fetchList, refreshUnreadCount]);
  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);
  /** Kéo làm mới không mở lại chi tiết và không tự đánh dấu đọc thông báo đang để chưa đọc. */
  const refresh = useCallback(async () => {
    await Promise.allSettled([refreshUnreadCount(), fetchList(0, "refresh")]);
  }, [fetchList, refreshUnreadCount]);
  /** Chỉ lấy trang tiếp khi còn dữ liệu và không có lượt phân trang/làm mới đang chạy. */
  const loadMore = useCallback(async () => {
    if (!hasNext || isListLoading || isRefreshing || morePending.current)
      return;
    morePending.current = true;
    await fetchList(page + 1, "more");
  }, [hasNext, isListLoading, isRefreshing, page, fetchList]);

  /** Ghi bản trả về từ PATCH vào thẻ và chi tiết đang mở, không tự tạo readAt cho một bản ghi đơn. */
  const applyItem = useCallback((updated: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSelectedNotification((prev) =>
      prev?.id === updated.id ? updated : prev,
    );
  }, []);

  /**
   * Hai thao tác cùng màn chạy nối tiếp, kể cả đọc tất cả và đánh dấu chưa đọc.
   * Mỗi thao tác vô hiệu GET cũ trước/sau PATCH rồi đồng bộ badge; lỗi giữ UI đã xác nhận và báo rõ.
   * Không retry PATCH: lỗi mạng có thể xảy ra sau khi server đã ghi, người dùng chủ động tải lại.
   */
  const enqueueMutation = useCallback(
    <T>(operation: () => Promise<T>, fallback: string): Promise<T | null> => {
      pendingMutations.current++;
      setIsUpdatingRead(true);
      const task = mutationQueue.current
        .then(async () => {
          if (!mounted.current) return null;
          dataVersion.current++;
          countRequest.current++;
          setActionError(null);
          try {
            return await operation();
          } catch (err: unknown) {
            if (mounted.current)
              setActionError(getFriendlyErrorMessage(err, fallback));
            return null;
          } finally {
            dataVersion.current++;
            if (mounted.current) await refreshUnreadCount();
          }
        })
        .finally(() => {
          pendingMutations.current--;
          if (mounted.current) setIsUpdatingRead(pendingMutations.current > 0);
        });
      mutationQueue.current = task;
      return task;
    },
    [refreshUnreadCount],
  );

  /** ID là thông báo đã mở; chỉ cập nhật sau PATCH thành công, không giảm badge bằng phép trừ. */
  const markOneAsRead = useCallback(
    (id: number) =>
      enqueueMutation(async () => {
        const updated = await notificationService.markAsRead(id);
        if (mounted.current) applyItem(updated);
        return updated;
      }, "Không thể đánh dấu thông báo đã đọc. Vui lòng thử lại."),
    [enqueueMutation, applyItem],
  );

  /** Giữ read=false sau khi bấm; chỉ một lần mở chi tiết mới mới gọi lại đánh dấu đọc. */
  const markOneAsUnread = useCallback(
    (id: number) =>
      enqueueMutation(async () => {
        const updated = await notificationService.markAsUnread(id);
        if (mounted.current) applyItem(updated);
        return updated;
      }, "Không thể đánh dấu thông báo chưa đọc. Vui lòng thử lại."),
    [enqueueMutation, applyItem],
  );

  /** Đọc tất cả dùng cùng hàng đợi với từng bản ghi; khóa bằng ref chặn hai lần bấm trước render kế tiếp. */
  const markAllAsRead = useCallback(async () => {
    if (unreadCount <= 0 || allReadPending.current) return;
    allReadPending.current = true;
    setIsMarkingAllRead(true);
    await enqueueMutation(async () => {
      const res = await notificationService.markAllAsRead();
      if (!mounted.current) return;
      setUnreadCount(res.unreadCount ?? 0);
      const markRead = (item: NotificationItem): NotificationItem => ({
        ...item,
        read: true,
        readAt: item.readAt || new Date().toISOString(),
      });
      setNotifications((prev) => prev.map(markRead));
      setSelectedNotification((prev) => (prev ? markRead(prev) : prev));
    }, "Không thể đánh dấu đọc tất cả. Vui lòng thử lại.");
    allReadPending.current = false;
    if (mounted.current) setIsMarkingAllRead(false);
  }, [unreadCount, enqueueMutation]);

  /**
   * Mọi loại thông báo mở modal trước, lấy đủ nội dung qua GET rồi mới PATCH đã đọc.
   * Chọn thông báo khác/đóng modal làm lượt GET cũ mất hiệu lực; GET lỗi không đánh dấu đọc.
   * relatedEntity.id là ID đơn nghỉ phép, chỉ nút trong chi tiết mới dùng nó để điều hướng.
   */
  const openDetail = useCallback(
    async (item: NotificationItem) => {
      const id = ++detailRequest.current;
      const version = dataVersion.current;
      setSelectedNotification(item);
      setDetailModalVisible(true);
      setIsDetailLoading(true);
      setDetailError(null);
      setActionError(null);
      try {
        const fullDetail = await notificationService.getNotificationDetail(
          item.id,
        );
        if (!mounted.current || id !== detailRequest.current) return;
        setSelectedNotification(fullDetail);
        setIsDetailLoading(false);
        // Nếu GET chồng với lần chưa đọc/đọc tất cả, trạng thái GET có thể cũ: xếp PATCH đọc sau thao tác đang chờ.
        if (
          !fullDetail.read ||
          version !== dataVersion.current ||
          pendingMutations.current > 0
        ) {
          await markOneAsRead(fullDetail.id);
        }
      } catch (err: unknown) {
        if (mounted.current && id === detailRequest.current) {
          setDetailError(
            getFriendlyErrorMessage(err, "Không thể tải chi tiết thông báo."),
          );
        }
      } finally {
        if (mounted.current && id === detailRequest.current)
          setIsDetailLoading(false);
      }
    },
    [markOneAsRead],
  );

  /** Đóng modal chỉ xóa nội dung đang xem; không đổi trạng thái đọc hoặc gọi API đối tượng liên quan. */
  const closeDetail = useCallback(() => {
    detailRequest.current++;
    setDetailModalVisible(false);
    setSelectedNotification(null);
    setIsDetailLoading(false);
    setDetailError(null);
    setActionError(null);
  }, []);

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
    isUpdatingRead,
    listError,
    selectedNotification,
    isDetailLoading,
    detailModalVisible,
    detailError,
    actionError,
    openDetail,
    closeDetail,
    loadMore,
    refresh,
    retryList: loadInitialData,
    markOneAsRead,
    markOneAsUnread,
    markAllAsRead,
    refreshUnreadCount,
  };
}

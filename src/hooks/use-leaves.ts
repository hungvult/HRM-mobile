import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { leaveService } from "../services";
import {
  LeaveBalanceItem,
  LeaveFilterStatus,
  LeaveRequestListItem,
  LeaveType,
} from "../types";
import { getFriendlyErrorMessage } from "../utils";

export interface UseLeavesReturn {
  // Year & Leave Balances
  selectedYear: number;
  balances: LeaveBalanceItem[];
  isBalanceLoading: boolean;
  balanceError: string | null;
  goToPreviousYear: () => void;
  goToNextYear: () => void;
  retryBalances: () => Promise<void>;

  // Filters & List
  filterStatus: LeaveFilterStatus;
  setFilterStatus: (status: LeaveFilterStatus) => void;
  requests: LeaveRequestListItem[];
  totalElements: number;
  isListLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  listError: string | null;
  hasNext: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  retryList: () => Promise<void>;

  // Leave Types (for creation)
  leaveTypes: LeaveType[];
  isTypesLoading: boolean;
  typesError: string | null;
  fetchLeaveTypes: () => Promise<void>;

  // Auto-sync after create / cancel
  syncAfterMutation: () => Promise<void>;
}

export function useLeaves(): UseLeavesReturn {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Leave Balances state
  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Leave Filter & Request List state
  const [filterStatus, setFilterStatusState] =
    useState<LeaveFilterStatus>("ALL");
  const [requests, setRequests] = useState<LeaveRequestListItem[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [isListLoading, setIsListLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);

  // Leave Types cache
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isTypesLoading, setIsTypesLoading] = useState<boolean>(false);
  const [typesError, setTypesError] = useState<string | null>(null);

  // Ref tracking to avoid stale closures in async requests
  const filterRef = useRef(filterStatus);
  filterRef.current = filterStatus;

  const yearRef = useRef(selectedYear);
  yearRef.current = selectedYear;

  // 1. Fetch Leave Balances
  const fetchBalances = useCallback(async (year: number) => {
    setIsBalanceLoading(true);
    setBalanceError(null);
    try {
      const res = await leaveService.getLeaveBalances(year);
      setBalances(res.items || []);
    } catch (err: any) {
      setBalanceError(
        getFriendlyErrorMessage(err, "Không thể tải số dư quỹ phép."),
      );
    } finally {
      setIsBalanceLoading(false);
    }
  }, []);

  // 2. Fetch Request List (Page 0 or Append)
  const fetchRequestList = useCallback(
    async (targetPage: number, status: LeaveFilterStatus, isAppend = false) => {
      if (isAppend) {
        setIsLoadingMore(true);
      } else {
        setIsListLoading(true);
        setListError(null);
      }

      try {
        const queryStatus = status === "ALL" ? undefined : status;
        const res = await leaveService.getMyLeaveRequests({
          page: targetPage,
          size: 20,
          status: queryStatus,
        });

        setPage(res.page);
        setTotalElements(res.totalElements);
        setHasNext(res.hasNext);

        setRequests((prev) => {
          if (!isAppend) {
            return res.content || [];
          }
          // Avoid duplicate items when paginating
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = (res.content || []).filter(
            (item) => !existingIds.has(item.id),
          );
          return [...prev, ...newItems];
        });
      } catch (err: any) {
        if (!isAppend) {
          setListError(
            getFriendlyErrorMessage(
              err,
              "Không thể tải danh sách đơn nghỉ phép.",
            ),
          );
        }
      } finally {
        if (isAppend) {
          setIsLoadingMore(false);
        } else {
          setIsListLoading(false);
        }
      }
    },
    [],
  );

  // 3. Parallel fetch using Promise.allSettled on initial load or year change
  const fetchAllInitial = useCallback(
    async (year: number, status: LeaveFilterStatus) => {
      setIsBalanceLoading(true);
      setIsListLoading(true);
      setBalanceError(null);
      setListError(null);

      const queryStatus = status === "ALL" ? undefined : status;

      const [balanceResult, listResult] = await Promise.allSettled([
        leaveService.getLeaveBalances(year),
        leaveService.getMyLeaveRequests({
          page: 0,
          size: 20,
          status: queryStatus,
        }),
      ]);

      if (balanceResult.status === "fulfilled") {
        setBalances(balanceResult.value.items || []);
      } else {
        setBalanceError(
          getFriendlyErrorMessage(
            balanceResult.reason,
            "Không thể tải số dư quỹ phép.",
          ),
        );
      }
      setIsBalanceLoading(false);

      if (listResult.status === "fulfilled") {
        setRequests(listResult.value.content || []);
        setPage(listResult.value.page);
        setTotalElements(listResult.value.totalElements);
        setHasNext(listResult.value.hasNext);
      } else {
        setListError(
          getFriendlyErrorMessage(
            listResult.reason,
            "Không thể tải danh sách đơn nghỉ phép.",
          ),
        );
      }
      setIsListLoading(false);
    },
    [],
  );

  // Fetch Leave Types
  const fetchLeaveTypes = useCallback(async () => {
    setIsTypesLoading(true);
    setTypesError(null);
    try {
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types || []);
    } catch (err: any) {
      setTypesError(
        getFriendlyErrorMessage(err, "Không thể tải danh mục loại phép."),
      );
    } finally {
      setIsTypesLoading(false);
    }
  }, []);

  // Initial trigger
  useEffect(() => {
    fetchAllInitial(selectedYear, filterStatus);
    fetchLeaveTypes();
  }, [selectedYear, fetchAllInitial, fetchLeaveTypes]);

  // Handle filter change
  const setFilterStatus = useCallback(
    (newStatus: LeaveFilterStatus) => {
      setFilterStatusState(newStatus);
      fetchRequestList(0, newStatus, false);
    },
    [fetchRequestList],
  );

  // Pull-to-refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        fetchBalances(yearRef.current),
        fetchRequestList(0, filterRef.current, false),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchBalances, fetchRequestList]);

  // Retry individual parts
  const retryBalances = useCallback(async () => {
    await fetchBalances(yearRef.current);
  }, [fetchBalances]);

  const retryList = useCallback(async () => {
    await fetchRequestList(0, filterRef.current, false);
  }, [fetchRequestList]);

  // Load more pagination
  const loadMore = useCallback(async () => {
    if (!hasNext || isLoadingMore || isListLoading) return;
    await fetchRequestList(page + 1, filterRef.current, true);
  }, [hasNext, isLoadingMore, isListLoading, page, fetchRequestList]);

  // Year navigation
  const goToPreviousYear = useCallback(() => {
    setSelectedYear((prev) => prev - 1);
  }, []);

  const goToNextYear = useCallback(() => {
    setSelectedYear((prev) => prev + 1);
  }, []);

  // Sync after mutation (Create or Cancel leave request)
  const syncAfterMutation = useCallback(async () => {
    await Promise.allSettled([
      fetchBalances(yearRef.current),
      fetchRequestList(0, filterRef.current, false),
    ]);
  }, [fetchBalances, fetchRequestList]);

  return {
    selectedYear,
    balances,
    isBalanceLoading,
    balanceError,
    goToPreviousYear,
    goToNextYear,
    retryBalances,

    filterStatus,
    setFilterStatus,
    requests,
    totalElements,
    isListLoading,
    isRefreshing,
    isLoadingMore,
    listError,
    hasNext,
    loadMore,
    refresh,
    retryList,

    leaveTypes,
    isTypesLoading,
    typesError,
    fetchLeaveTypes,

    syncAfterMutation,
  };
}

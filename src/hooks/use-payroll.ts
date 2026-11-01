import { useCallback, useEffect, useMemo, useState } from "react";
import { payrollService } from "../services";
import { MyPayslipSummaryItem, PayslipDetail } from "../types";
import { getFriendlyErrorMessage } from "../utils/formatters";

export interface UsePayrollResult {
  selectedYear: number | null;
  availableYears: number[];
  payslips: MyPayslipSummaryItem[];
  selectedPeriodId: number | null;
  selectedPayslip: MyPayslipSummaryItem | null;
  isAmountHidden: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  setSelectedYear: (year: number | null) => void;
  selectPeriod: (runId: number) => void;
  toggleAmountVisibility: () => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
}

export function usePayroll(): UsePayrollResult {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const availableYears = useMemo(
    () => [currentYear, currentYear - 1, currentYear - 2],
    [currentYear],
  );

  const [selectedYear, setSelectedYearState] = useState<number | null>(null);
  const [payslips, setPayslips] = useState<MyPayslipSummaryItem[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [isAmountHidden, setIsAmountHidden] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);

  const fetchPayslips = useCallback(
    async (
      targetPage: number,
      year: number | null,
      isRefresh = false,
      isAppend = false,
    ) => {
      if (isAppend) {
        setIsLoadingMore(true);
      } else if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await payrollService.getMyPayslips({
          page: targetPage,
          size: 20,
          year: year ?? undefined,
        });

        const newItems = response.content || [];
        setPayslips((prev) => (isAppend ? [...prev, ...newItems] : newItems));
        setPage(response.page);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
        setHasNext(response.hasNext);

        // Auto select first/latest item if not selected or refreshing
        if (!isAppend && newItems.length > 0) {
          setSelectedPeriodId((prev) => {
            const exists = newItems.some((item) => item.payrollRunId === prev);
            return exists ? prev : newItems[0].payrollRunId;
          });
        } else if (!isAppend && newItems.length === 0) {
          setSelectedPeriodId(null);
        }
      } catch (err: unknown) {
        const message = getFriendlyErrorMessage(
          err,
          "Không thể tải danh sách phiếu lương.",
        );
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  // Initial load or year change
  useEffect(() => {
    fetchPayslips(0, selectedYear);
  }, [fetchPayslips, selectedYear]);

  const setSelectedYear = useCallback((year: number | null) => {
    setSelectedYearState(year);
    setPage(0);
  }, []);

  const selectPeriod = useCallback((runId: number) => {
    setSelectedPeriodId(runId);
  }, []);

  const toggleAmountVisibility = useCallback(() => {
    setIsAmountHidden((prev) => !prev);
  }, []);

  const refresh = useCallback(async () => {
    await fetchPayslips(0, selectedYear, true, false);
  }, [fetchPayslips, selectedYear]);

  const loadMore = useCallback(async () => {
    if (!hasNext || isLoadingMore || isLoading || isRefreshing) {
      return;
    }
    await fetchPayslips(page + 1, selectedYear, false, true);
  }, [
    hasNext,
    isLoadingMore,
    isLoading,
    isRefreshing,
    fetchPayslips,
    page,
    selectedYear,
  ]);

  const retry = useCallback(async () => {
    await fetchPayslips(0, selectedYear, false, false);
  }, [fetchPayslips, selectedYear]);

  const selectedPayslip = useMemo(() => {
    if (!payslips || payslips.length === 0) return null;
    if (selectedPeriodId !== null) {
      const found = payslips.find((p) => p.payrollRunId === selectedPeriodId);
      if (found) return found;
    }
    return payslips[0];
  }, [payslips, selectedPeriodId]);

  return {
    selectedYear,
    availableYears,
    payslips,
    selectedPeriodId,
    selectedPayslip,
    isAmountHidden,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    page,
    totalElements,
    totalPages,
    hasNext,
    setSelectedYear,
    selectPeriod,
    toggleAmountVisibility,
    refresh,
    loadMore,
    retry,
  };
}

export interface UsePayslipDetailResult {
  detail: PayslipDetail | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  errorCode: string | null;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
}

export function usePayslipDetail(
  payrollRunId?: number | null,
): UsePayslipDetailResult {
  const [detail, setDetail] = useState<PayslipDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (isRefresh = false) => {
      if (!payrollRunId || isNaN(payrollRunId)) {
        setIsLoading(false);
        setError("Mã kỳ lương không hợp lệ.");
        setErrorCode("INVALID_ID");
        return;
      }

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      setErrorCode(null);

      try {
        const data = await payrollService.getMyPayslipDetail(payrollRunId);
        setDetail(data);
      } catch (err: unknown) {
        const code = (err as any)?.code || null;
        setErrorCode(code);
        const message = getFriendlyErrorMessage(
          err,
          "Không thể tải chi tiết phiếu lương.",
        );
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [payrollRunId],
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const refresh = useCallback(async () => {
    await fetchDetail(true);
  }, [fetchDetail]);

  const retry = useCallback(async () => {
    await fetchDetail(false);
  }, [fetchDetail]);

  return {
    detail,
    isLoading,
    isRefreshing,
    error,
    errorCode,
    refresh,
    retry,
  };
}

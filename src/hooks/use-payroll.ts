import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { payrollService } from "../services";
import { PayslipAvailability, PayslipDetail } from "../types";
import { getFriendlyErrorMessage } from "../utils/formatters";

export interface UsePayslipDetailResult {
  detail: PayslipDetail | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  errorCode: string | null;
  availability: PayslipAvailability;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
}

/**
 * Tải snapshot lương cho một khóa kỳ hoặc ID đợt lương, chỉ đọc qua service có bảo vệ phiên.
 * Mỗi lượt tải có số thứ tự; đổi khóa/unmount loại kết quả cũ, kể cả lỗi và finally.
 * Dữ liệu chỉ được trả khi khóa khớp kỳ đang chọn, nên tiêu đề mới không đi cùng số tiền kỳ cũ.
 */
function usePayslipResource(
  key: string,
  load: () => Promise<PayslipDetail>,
  isPeriodLookup = false,
): UsePayslipDetailResult {
  const requestId = useRef(0);
  const [state, setState] = useState({
    key,
    detail: null as PayslipDetail | null,
    isLoading: true,
    isRefreshing: false,
    error: null as string | null,
    errorCode: null as string | null,
  });

  // Xóa snapshot ngay khi bắt đầu tải; lỗi hoặc kỳ chưa công bố không giữ số tiền đã xem trước đó.
  const fetchDetail = useCallback(
    async (isRefresh = false) => {
      const id = ++requestId.current;
      setState({
        key,
        detail: null,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null,
        errorCode: null,
      });
      try {
        const detail = await load();
        if (id !== requestId.current) return;
        setState({
          key,
          detail,
          isLoading: false,
          isRefreshing: false,
          error: null,
          errorCode: null,
        });
      } catch (err: unknown) {
        if (id !== requestId.current) return;
        const code = (err as { code?: string })?.code ?? null;
        // API theo kỳ: NOT_FOUND là thiếu hồ sơ/kỳ/phiếu, NOT_AVAILABLE chỉ là chưa công bố.
        // Route theo runId cũ vẫn giữ nghĩa chưa khả dụng vì mã đó còn dùng khi thiếu phiếu hoặc khác chủ.
        const error =
          isPeriodLookup && code === "PAYSLIP_NOT_AVAILABLE"
            ? "Phiếu lương kỳ này chưa được công bố."
            : code === "PAYSLIP_NOT_FOUND"
              ? "Chưa có phiếu lương cho kỳ đã chọn."
              : getFriendlyErrorMessage(
                  err,
                  "Không thể tải chi tiết phiếu lương.",
                );
        setState({
          key,
          detail: null,
          isLoading: false,
          isRefreshing: false,
          error,
          errorCode: code,
        });
      }
    },
    [key, load, isPeriodLookup],
  );

  // Cleanup hủy quyền cập nhật của request, không sửa API chung hoặc phục hồi dữ liệu sau logout.
  useEffect(() => {
    void fetchDetail();
    return () => {
      requestId.current += 1;
    };
  }, [fetchDetail]);

  const refresh = useCallback(() => fetchDetail(true), [fetchDetail]);
  const retry = useCallback(() => fetchDetail(false), [fetchDetail]);
  const current = state.key === key;
  return {
    detail: current ? state.detail : null,
    isLoading: !current || state.isLoading,
    isRefreshing: current && state.isRefreshing,
    error: current ? state.error : null,
    errorCode: current ? state.errorCode : null,
    availability: !current
      ? null
      : state.errorCode === "PAYSLIP_NOT_FOUND"
        ? "not-found"
        : state.errorCode === "PAYSLIP_NOT_AVAILABLE"
          ? isPeriodLookup
            ? "not-published"
            : "unavailable"
          : null,
    refresh,
    retry,
  };
}

export interface UsePayrollResult extends UsePayslipDetailResult {
  selectedYear: number;
  selectedMonth: number;
  isAmountHidden: boolean;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  toggleAmountVisibility: () => void;
}

/**
 * Dùng tại tab phiếu lương: mặc định đúng tháng/năm trên thiết bị rồi lấy trực tiếp chi tiết.
 * Không chọn đợt lương đầu danh sách; tháng chưa có/chưa công bố được trả thành trạng thái riêng.
 * Con mắt giữ lựa chọn khi đổi kỳ và áp dụng cho mọi khoản tiền trong phần hiển thị dùng chung.
 */
export function usePayroll(): UsePayrollResult {
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [isAmountHidden, setIsAmountHidden] = useState(false);
  const load = useCallback(
    () => payrollService.getMyPayslipByPeriod(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );
  const resource = usePayslipResource(
    `${selectedYear}-${selectedMonth}`,
    load,
    true,
  );
  const toggleAmountVisibility = useCallback(
    () => setIsAmountHidden((value) => !value),
    [],
  );
  return {
    ...resource,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    isAmountHidden,
    toggleAmountVisibility,
  };
}

/**
 * Giữ deep link cũ: payrollRunId là ID đợt tính lương, không phải nhân viên hoặc phiếu lương.
 * ID sai dừng trước API; đổi ID dùng cùng bộ chặn phản hồi cũ như màn chọn tháng/năm.
 */
export function usePayslipDetail(
  payrollRunId?: number | null,
): UsePayslipDetailResult {
  const load = useCallback(async () => {
    if (
      !payrollRunId ||
      !Number.isSafeInteger(payrollRunId) ||
      payrollRunId <= 0
    ) {
      throw { code: "INVALID_ID", message: "Mã kỳ lương không hợp lệ." };
    }
    return payrollService.getMyPayslipDetail(payrollRunId);
  }, [payrollRunId]);
  return usePayslipResource(`run-${payrollRunId}`, load);
}

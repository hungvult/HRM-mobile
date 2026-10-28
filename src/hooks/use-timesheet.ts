import { useCallback, useEffect, useMemo, useState } from "react";
import { attendanceService } from "../services";
import {
  MonthlyAttendanceItem,
  MonthlyAttendanceResponse,
  MonthlyAttendanceSummary,
} from "../types";
import { ApiError } from "../services/api";
import { getFriendlyErrorMessage } from "../utils";

function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export interface UseTimesheetReturn {
  selectedMonth: string;
  selectedDate: string | null;
  items: MonthlyAttendanceItem[];
  summary: MonthlyAttendanceSummary;
  isLoading: boolean;
  error: string | null;
  isCurrentMonth: boolean;
  refresh: () => Promise<void>;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  setSelectedDate: (date: string | null) => void;
}

export function useTimesheet(): UseTimesheetReturn {
  const currentYearMonth = useMemo(() => getCurrentYearMonth(), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [data, setData] = useState<MonthlyAttendanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isCurrentMonth = selectedMonth === currentYearMonth;

  const fetchMonthly = useCallback(async (month: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await attendanceService.getMonthlyAttendance(month);
      setData(res);
    } catch (err: any) {
      setError(
        getFriendlyErrorMessage(err, "Không thể tải bảng công theo tháng."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonthly(selectedMonth);
    // Reset selected date when month changes
    setSelectedDate(null);
  }, [selectedMonth, fetchMonthly]);

  const refresh = useCallback(async () => {
    await fetchMonthly(selectedMonth);
  }, [fetchMonthly, selectedMonth]);

  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const parts = prev.split("-").map(Number);
      let year = parts[0];
      let month = parts[1] - 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      return `${year}-${String(month).padStart(2, "0")}`;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const parts = prev.split("-").map(Number);
      let year = parts[0];
      let month = parts[1] + 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      return `${year}-${String(month).padStart(2, "0")}`;
    });
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setSelectedMonth(currentYearMonth);
  }, [currentYearMonth]);

  const items = useMemo(() => data?.items || [], [data]);

  const summary = useMemo<MonthlyAttendanceSummary>(() => {
    let totalWorkDays = 0;
    let totalWorkingMinutes = 0;
    let lateDays = 0;
    let incompleteDays = 0;
    let leaveDays = 0;
    let absentDays = 0;

    for (const item of items) {
      // Các trạng thái được tính là có đi làm trong ngày
      const isWorkedDay =
        item.attendanceStatus === "PRESENT" ||
        item.attendanceStatus === "LATE" ||
        item.attendanceStatus === "EARLY_LEAVE" ||
        item.attendanceStatus === "LATE_AND_EARLY_LEAVE";

      if (isWorkedDay) {
        totalWorkDays += 1;
      }

      if (item.workingMinutes && item.workingMinutes > 0) {
        totalWorkingMinutes += item.workingMinutes;
      }

      if (
        item.attendanceStatus === "LATE" ||
        item.attendanceStatus === "LATE_AND_EARLY_LEAVE"
      ) {
        lateDays += 1;
      } else if (item.attendanceStatus === "INCOMPLETE") {
        incompleteDays += 1;
      } else if (item.attendanceStatus === "LEAVE") {
        leaveDays += 1;
      } else if (item.attendanceStatus === "ABSENT") {
        absentDays += 1;
      }
    }

    return {
      totalWorkDays,
      totalWorkingMinutes,
      lateDays,
      incompleteDays,
      leaveDays,
      absentDays,
    };
  }, [items]);

  return {
    selectedMonth,
    selectedDate,
    items,
    summary,
    isLoading,
    error,
    isCurrentMonth,
    refresh,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    setSelectedDate,
  };
}

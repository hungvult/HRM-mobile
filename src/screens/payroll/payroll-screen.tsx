import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MainTopBar } from "../../components/navigation/main-top-bar";
import { PeriodSelector } from "../../components/payroll/period-selector";
import { PayslipDetailView } from "../../components/payroll/payslip-detail-view";
import { usePayroll } from "../../hooks/use-payroll";
import { colors } from "../../constants";

/** Tab phiếu lương mở chi tiết của tháng/năm hiện tại; đổi kỳ tải trực tiếp, không đi qua danh sách. */
export function PayrollScreen() {
  const payroll = usePayroll();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bgApp }}
      edges={["top"]}
    >
      <MainTopBar title="Phiếu lương cá nhân" />
      <PeriodSelector
        selectedYear={payroll.selectedYear}
        selectedMonth={payroll.selectedMonth}
        onSelectYear={payroll.setSelectedYear}
        onSelectMonth={payroll.setSelectedMonth}
      />
      <PayslipDetailView
        {...payroll}
        onToggleAmountVisibility={payroll.toggleAmountVisibility}
      />
    </SafeAreaView>
  );
}

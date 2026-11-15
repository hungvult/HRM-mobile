import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePayslipDetail } from "../../hooks/use-payroll";
import { PayslipDetailView } from "../../components/payroll/payslip-detail-view";
import { colors } from "../../constants";

/** Giữ route/deep link theo payrollRunId và dùng chung cách che toàn bộ số tiền với tab phiếu lương. */
export function PayslipDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ payrollRunId?: string }>();
  const runId = params.payrollRunId ? Number(params.payrollRunId) : null;
  const resource = usePayslipDetail(runId);
  const [isAmountHidden, setIsAmountHidden] = useState(false);
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bgApp }}
      edges={["bottom"]}
    >
      <PayslipDetailView
        onBack={() => router.back()}
        {...resource}
        isAmountHidden={isAmountHidden}
        onToggleAmountVisibility={() => setIsAmountHidden((value) => !value)}
      />
    </SafeAreaView>
  );
}

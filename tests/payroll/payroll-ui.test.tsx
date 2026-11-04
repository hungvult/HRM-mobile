import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock(
  "react-native",
  async () => (await import("./mobile-ui-mock")).nativeUI,
);
vi.mock("react-native-safe-area-context", async () => ({
  SafeAreaView: (await import("./mobile-ui-mock")).nativeUI.SafeAreaView,
}));
vi.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
vi.mock("@/services", () => ({
  payrollService: {
    getMyPayslipByPeriod: vi.fn(),
    getMyPayslipDetail: vi.fn(),
  },
}));
vi.mock("@/components/navigation/main-top-bar", () => ({
  MainTopBar: ({ title }: { title: string }) => <span>{title}</span>,
}));
vi.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ payrollRunId: "88" }),
  useRouter: () => ({ back: vi.fn() }),
}));
import { payrollService } from "@/services";
import { PayrollScreen } from "@/screens/payroll/payroll-screen";
import { PayslipDetailScreen } from "@/screens/payroll/payslip-detail-screen";
import { formatCurrency } from "@/utils/formatters";
import { mockDetailData } from "./fixtures";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(payrollService.getMyPayslipByPeriod).mockResolvedValue(
    mockDetailData,
  );
  vi.mocked(payrollService.getMyPayslipDetail).mockResolvedValue(
    mockDetailData,
  );
});
afterEach(cleanup);

describe("UC019 UI", () => {
  it("hiển thị chi tiết trực tiếp và con mắt che mọi khoản tiền khỏi nội dung/accessibility", async () => {
    const { container } = render(<PayrollScreen />);
    await screen.findByText("Nguyễn Văn An");
    expect(screen.getByText("Bảng kê khấu trừ")).toBeTruthy();
    expect(payrollService.getMyPayslipDetail).not.toHaveBeenCalled();
    for (const value of Object.values(mockDetailData.amounts))
      expect(container.textContent).toContain(formatCurrency(value));
    fireEvent.click(screen.getByRole("button", { name: "Ẩn mọi số tiền" }));
    for (const value of Object.values(mockDetailData.amounts)) {
      expect(container.textContent).not.toContain(formatCurrency(value));
      expect(container.innerHTML).not.toContain(String(value));
    }
    expect(screen.getAllByText("Số tiền đã ẩn")).toHaveLength(9);
    fireEvent.click(screen.getByRole("button", { name: "Hiện mọi số tiền" }));
    expect(container.textContent).toContain(
      formatCurrency(mockDetailData.amounts.netSalary),
    );
  });

  it("đổi tháng không giữ tiền cũ dưới lựa chọn kỳ mới", async () => {
    const { container } = render(<PayrollScreen />);
    await screen.findByText("Nguyễn Văn An");
    vi.mocked(payrollService.getMyPayslipByPeriod).mockReturnValue(
      new Promise(() => {}),
    );
    const today = new Date();
    const month = today.getMonth() === 0 ? 2 : 1;
    fireEvent.click(
      screen.getByRole("button", {
        name: `Tháng ${month}, năm ${today.getFullYear()}`,
      }),
    );
    await waitFor(() =>
      expect(container.textContent).not.toContain(
        formatCurrency(mockDetailData.amounts.netSalary),
      ),
    );
    expect(
      screen
        .getByRole("button", {
          name: `Tháng ${month}, năm ${today.getFullYear()}`,
        })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("route cũ vẫn tải theo ID đợt lương và dùng cùng con mắt", async () => {
    const { container } = render(<PayslipDetailScreen />);
    await screen.findByText("Nguyễn Văn An");
    expect(payrollService.getMyPayslipDetail).toHaveBeenCalledWith(88);
    fireEvent.click(screen.getByRole("button", { name: "Ẩn mọi số tiền" }));
    expect(container.textContent).not.toContain(
      formatCurrency(mockDetailData.amounts.netSalary),
    );
  });
});

it.each([
  [
    "PAYSLIP_NOT_FOUND",
    "Chưa có phiếu lương",
    "Chưa có phiếu lương cho kỳ đã chọn.",
  ],
  [
    "PAYSLIP_NOT_AVAILABLE",
    "Phiếu lương chưa công bố",
    "Phiếu lương kỳ này chưa được công bố.",
  ],
])(
  "tab hiển thị đúng trạng thái API thực tế %s và không giữ tiền",
  async (code, title, message) => {
    vi.mocked(payrollService.getMyPayslipByPeriod).mockRejectedValue({
      code,
      status: 404,
    });
    const { container } = render(<PayrollScreen />);
    await screen.findByText(title);
    expect(screen.getByText(message)).toBeTruthy();
    expect(container.textContent).not.toContain(
      formatCurrency(mockDetailData.amounts.netSalary),
    );
  },
);

it.each([2000, 2100])("bộ chọn năm dừng ở giới hạn API %s", async (year) => {
  const { PeriodSelector } =
    await import("@/components/payroll/period-selector");
  const select = vi.fn();
  render(
    <PeriodSelector
      selectedYear={year}
      selectedMonth={11}
      onSelectYear={select}
      onSelectMonth={vi.fn()}
    />,
  );
  const direction = year === 2000 ? "Năm trước" : "Năm sau";
  fireEvent.click(screen.getByRole("button", { name: direction }));
  expect(select).not.toHaveBeenCalled();
});

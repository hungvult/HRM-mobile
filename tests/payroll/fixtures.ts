import { PayslipDetail } from "@/types/payroll";

export const mockDetailData: PayslipDetail = {
  payrollRunId: 88,
  period: {
    year: 2026,
    month: 9,
    isPeriodClosed: true,
  },
  publishedAt: "2026-10-02T02:00:00Z",
  employee: {
    id: 101,
    employeeCode: "NV00101",
    fullName: "Nguyễn Văn An",
    department: {
      id: 3,
      code: "IT",
      name: "Công nghệ thông tin",
    },
  },
  work: {
    standardWorkingDays: 22,
    standardMinutesPerDay: 480,
    paidMinutes: 10560,
    paidWorkingDays: 22,
  },
  amounts: {
    baseSalaryMonthly: 22000000,
    allowanceMonthly: 2200000,
    deductionMonthly: 1100000,
    earnedBaseSalary: 22000000,
    earnedAllowance: 2200000,
    earnedDeduction: 1100000,
    netSalary: 23100000,
  },
  salaryProfileId: 18,
};

export interface DepartmentSnapshot {
  id: number;
  code: string;
  name: string;
}

export interface EmployeeSnapshot {
  id: number;
  employeeCode: string;
  fullName: string;
  department?: DepartmentSnapshot | null;
}

export interface WorkSnapshot {
  standardWorkingDays: number;
  standardMinutesPerDay: number;
  paidMinutes: number;
  paidWorkingDays: number;
}

export interface PayrollAmounts {
  baseSalaryMonthly: number;
  allowanceMonthly: number;
  deductionMonthly: number;
  earnedBaseSalary: number;
  earnedAllowance: number;
  earnedDeduction: number;
  netSalary: number;
}

export interface PayslipPeriod {
  year: number;
  month: number;
  isPeriodClosed?: boolean;
}

export interface MyPayslipSummaryItem {
  payrollRunId: number;
  year: number;
  month: number;
  netSalary: number;
  publishedAt: string;
}

export interface MyPayslipsParams {
  year?: number;
  page?: number;
  size?: number;
}

export interface MyPayslipsResponse {
  content: MyPayslipSummaryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface PayslipDetail {
  id?: number;
  payrollRunId: number;
  period: PayslipPeriod;
  publishedAt: string;
  employee: EmployeeSnapshot;
  work: WorkSnapshot;
  amounts: PayrollAmounts;
  salaryProfileId?: number;
}

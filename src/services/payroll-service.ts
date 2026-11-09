import { MyPayslipsParams, MyPayslipsResponse, PayslipDetail } from "../types";
import { request } from "./api";

export const payrollService = {
  /**
   * Lấy danh sách kỳ lương cá nhân đã công bố (API L11)
   * GET /api/v1/payroll/my-payslips
   */
  async getMyPayslips(
    params: MyPayslipsParams = {},
  ): Promise<MyPayslipsResponse> {
    const queryParts: string[] = [];

    const page = params.page ?? 0;
    const size = params.size ?? 20;
    queryParts.push(`page=${page}`);
    queryParts.push(`size=${size}`);

    if (params.year !== undefined && params.year !== null) {
      queryParts.push(`year=${params.year}`);
    }

    const queryStr = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

    return await request<MyPayslipsResponse>(
      `/payroll/my-payslips${queryStr}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  },

  /**
   * Lấy chi tiết phiếu lương cá nhân theo mã kỳ lương (API L12)
   * GET /api/v1/payroll/my-payslips/{payrollRunId}
   */
  async getMyPayslipDetail(payrollRunId: number): Promise<PayslipDetail> {
    const res = await request<any>(`/payroll/my-payslips/${payrollRunId}`, {
      method: "GET",
      requiresAuth: true,
    });

    // Normalize response payload (supports both flat structure and backend nested item envelope)
    const period = res.period ?? {
      year: res.year,
      month: res.month,
      isPeriodClosed: res.isPeriodClosed ?? true,
    };
    const employee = res.employee ?? res.item?.employee;
    const work = res.work ?? res.item?.work;
    const amounts = res.amounts ?? res.item?.amounts;
    const salaryProfileId = res.salaryProfileId ?? res.item?.salaryProfileId;

    return {
      id: res.id ?? res.item?.id,
      payrollRunId: res.payrollRunId ?? payrollRunId,
      period,
      publishedAt: res.publishedAt,
      employee,
      work,
      amounts,
      salaryProfileId,
    };
  },
};

import { MyPayslipsParams, MyPayslipsResponse, PayslipDetail } from "../types";
import { request } from "./api";

/** Dùng chung cho API theo kỳ và deep link theo ID đợt lương; chỉ đổi cấu trúc, không tính lại snapshot. */
function normalizePayslip(res: any, payrollRunId?: number): PayslipDetail {
  // Backend có thể trả snapshot trong item hoặc trả phẳng như hợp đồng chi tiết cũ.
  return {
    id: res.id ?? res.item?.id,
    payrollRunId: res.payrollRunId ?? payrollRunId,
    period: res.period ?? {
      year: res.year,
      month: res.month,
      isPeriodClosed: res.isPeriodClosed ?? true,
    },
    publishedAt: res.publishedAt,
    employee: res.employee ?? res.item?.employee,
    work: res.work ?? res.item?.work,
    amounts: res.amounts ?? res.item?.amounts,
    salaryProfileId: res.salaryProfileId ?? res.item?.salaryProfileId,
  };
}

export const payrollService = {
  /**
   * Lấy đúng tháng/năm người dùng chọn, không gửi ID nhân viên từ app.
   * Backend tìm nhân viên theo phiên và trả snapshot đã công bố; lỗi được giữ nguyên để phân biệt chưa có/chưa công bố.
   * Dùng request chung để phản hồi của phiên đã logout không trả dữ liệu lương về màn hình.
   */
  async getMyPayslipByPeriod(
    year: number,
    month: number,
  ): Promise<PayslipDetail> {
    const res = await request<unknown>(
      `/payroll/my-payslips/by-period?year=${year}&month=${month}`,
      { method: "GET", requiresAuth: true },
    );
    return normalizePayslip(res);
  },
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

    // Deep link cũ vẫn dùng ID đợt lương và cùng cách chuẩn hóa với màn chọn kỳ.
    return normalizePayslip(res, payrollRunId);
  },
};

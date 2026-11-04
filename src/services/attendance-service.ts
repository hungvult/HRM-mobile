import {
  AttendanceActionResponse,
  AttendanceLocationRequest,
  AttendancePrecheckResponse,
  MonthlyAttendanceResponse,
  TodayAttendance,
} from "../types";
import { request } from "./api";

export const attendanceService = {
  // Gửi bằng chứng ngầm bằng phiên hiện tại; BE lấy IP từ kết nối và là nơi duy nhất quyết định đạt hay không.
  // Không lấy được GPS thì gửi {}; signal cho phép hủy khi rời màn, đổi mạng hoặc app chạy nền.
  async preCheck(
    location: AttendanceLocationRequest | undefined,
    signal: AbortSignal,
  ): Promise<AttendancePrecheckResponse> {
    return await request<AttendancePrecheckResponse>("/attendance/pre-check", {
      method: "POST",
      body: JSON.stringify(location ?? {}),
      requiresAuth: true,
      signal,
    });
  },

  async getTodayAttendance(): Promise<TodayAttendance> {
    return await request<TodayAttendance>("/me/attendance/today", {
      method: "GET",
      requiresAuth: true,
    });
  },

  async getMonthlyAttendance(
    month: string,
  ): Promise<MonthlyAttendanceResponse> {
    return await request<MonthlyAttendanceResponse>(
      `/me/attendance?month=${encodeURIComponent(month)}`,
      {
        method: "GET",
        requiresAuth: true,
      },
    );
  },

  async checkIn(
    location?: AttendanceLocationRequest,
  ): Promise<AttendanceActionResponse> {
    return await request<AttendanceActionResponse>("/attendance/check-in", {
      method: "POST",
      // Không lấy được GPS thì gửi nhóm rỗng để server xác minh Wi-Fi, không tự tạo tọa độ thay thế.
      body: JSON.stringify(location ?? {}),
      requiresAuth: true,
    });
  },

  async checkOut(
    location?: AttendanceLocationRequest,
  ): Promise<AttendanceActionResponse> {
    return await request<AttendanceActionResponse>("/attendance/check-out", {
      method: "POST",
      // Dùng cùng hợp đồng bằng chứng với check-in; quyền quyết định chấm công luôn ở backend.
      body: JSON.stringify(location ?? {}),
      requiresAuth: true,
    });
  },
};

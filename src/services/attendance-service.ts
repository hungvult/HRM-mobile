import {
  AttendanceActionResponse,
  AttendanceLocationRequest,
  MonthlyAttendanceResponse,
  TodayAttendance,
} from "../types";
import { request } from "./api";

export const attendanceService = {
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
    location: AttendanceLocationRequest,
  ): Promise<AttendanceActionResponse> {
    return await request<AttendanceActionResponse>("/attendance/check-in", {
      method: "POST",
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
      }),
      requiresAuth: true,
    });
  },

  async checkOut(
    location: AttendanceLocationRequest,
  ): Promise<AttendanceActionResponse> {
    return await request<AttendanceActionResponse>("/attendance/check-out", {
      method: "POST",
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
      }),
      requiresAuth: true,
    });
  },
};

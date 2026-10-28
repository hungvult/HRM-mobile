export type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "INCOMPLETE"
  | "ABSENT"
  | "LEAVE"
  | "HOLIDAY"
  | "EARLY_LEAVE"
  | "LATE_AND_EARLY_LEAVE";

export interface TodayAttendance {
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  workingMinutes: number | null;
  attendanceStatus: AttendanceStatus | null;
  checkedIn: boolean;
  checkedOut: boolean;
}

export interface AttendanceLocationRequest {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  locationCapturedAt: string;
}

export interface AttendanceActionResponse {
  attendanceRecordId: number;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  workingMinutes: number | null;
  message: string;
}

export interface MonthlyAttendanceItem {
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  workingMinutes: number | null;
  attendanceStatus: AttendanceStatus;
}

export interface MonthlyAttendanceResponse {
  month: string;
  items: MonthlyAttendanceItem[];
}

export interface MonthlyAttendanceSummary {
  totalWorkDays: number;
  totalWorkingMinutes: number;
  lateDays: number;
  incompleteDays: number;
  leaveDays: number;
  absentDays: number;
}

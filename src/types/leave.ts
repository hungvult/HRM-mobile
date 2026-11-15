export type LeaveRequestStatus =
  "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type LeaveFilterStatus = "ALL" | LeaveRequestStatus;

export interface LeaveType {
  id: number;
  code: string;
  name: string;
  annualQuotaDays: number;
  paid: boolean;
}

export interface LeaveBalanceItem {
  leaveTypeId: number;
  leaveTypeCode: string;
  leaveTypeName: string;
  allocatedDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface LeaveBalanceResponse {
  year: number;
  items: LeaveBalanceItem[];
}

export interface CreateLeaveRequestPayload {
  leaveTypeId: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
}

// Ảnh cục bộ do bộ chọn ảnh trả về; file chỉ có trên Web, uri dùng cho Android/iOS.
export interface LeaveAttachmentUpload {
  uri: string;
  fileName: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  file?: File;
}

export interface LeaveAttachmentMetadata {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
}

export interface CreateLeaveRequestResponse {
  id: number;
  requestCode: string;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  requestedDays: number;
  status: LeaveRequestStatus;
  createdAt: string;
}

export interface LeaveRequestListItem {
  id: number;
  requestCode: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  reason?: string;
  status: LeaveRequestStatus;
  createdAt: string;
}

export interface LeaveRequestPageResponse {
  content: LeaveRequestListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface LeaveStatusHistoryItem {
  oldStatus: LeaveRequestStatus | null;
  newStatus: LeaveRequestStatus;
  changedByEmployeeId: number;
  changedByEmployeeName: string;
  changedAt: string;
  note: string | null;
}

export interface LeaveRequestDetail {
  id: number;
  requestCode: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  reason: string;
  status: LeaveRequestStatus;
  reviewedByEmployeeId: number | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: LeaveStatusHistoryItem[];
  attachment?: LeaveAttachmentMetadata | null;
}

export interface CancelLeaveRequestResponse {
  id: number;
  requestCode: string;
  status: LeaveRequestStatus;
  cancelledAt: string;
  updatedAt: string;
  statusHistory: LeaveStatusHistoryItem[];
}

export interface GetMyLeaveRequestsParams {
  page?: number;
  size?: number;
  status?: LeaveRequestStatus;
  leaveTypeId?: number;
  fromDate?: string;
  toDate?: string;
}

/**
 * Authentication and User Data Types
 */

export type UserRole = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

export interface Department {
  id: number;
  code: string;
  name: string;
}

export interface Position {
  id: number;
  code: string;
  name: string;
}

export interface Manager {
  id: number;
  employeeCode: string;
  fullName: string;
}

export interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  email?: string;
  phone?: string;
  address?: string;
  hireDate?: string;
  employmentStatus: "WORKING" | "PROBATION" | "RESIGNED" | "TERMINATED";
  department?: Department | null;
  position?: Position | null;
  manager?: Manager | null;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  roles: UserRole[];
  employee?: Employee | null;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  deviceInfo?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  traceId?: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Authentication Data Types
 */

export type UserRole = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

export interface LoginUser {
  id: number;
  username: string;
  roles: UserRole[];
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
  user: LoginUser;
}

export interface RefreshTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
  };
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

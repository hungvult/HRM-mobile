export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

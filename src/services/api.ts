import { API_BASE_URL } from '../constants';
import { ApiErrorResponse } from '../types';
import { authStorage } from './auth-storage';

export class ApiError extends Error {
  public status: number;
  public code: string;
  public timestamp?: string;
  public errors?: Array<{ field: string; message: string }>;

  constructor(data: ApiErrorResponse) {
    super(data.message || 'Đã có lỗi xảy ra.');
    this.name = 'ApiError';
    this.status = data.status;
    this.code = data.code;
    this.timestamp = data.timestamp;
    this.errors = data.errors;
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, headers = {}, ...customConfig } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await authStorage.getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // Ensure leading slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...customConfig,
      headers: requestHeaders,
      credentials: 'include', // send and receive HttpOnly cookies
    });
  } catch (error) {
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.',
      path: cleanEndpoint,
    });
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const errorData: ApiErrorResponse = await response.json();
      throw new ApiError(errorData);
    }
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: response.status,
      code: 'HTTP_ERROR',
      message: `Yêu cầu thất bại với mã lỗi ${response.status}`,
      path: cleanEndpoint,
    });
  }

  if (isJson) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

import { API_BASE_URL } from "../constants";
import { ApiErrorResponse } from "../types";
import { authStorage } from "./auth-storage";

export class ApiError extends Error {
  public status: number;
  public code: string;
  public timestamp?: string;
  public errors?: Array<{ field: string; message: string }>;

  constructor(data: ApiErrorResponse) {
    super(data.message || "Đã có lỗi xảy ra.");
    this.name = "ApiError";
    this.status = data.status;
    this.code = data.code;
    this.timestamp = data.timestamp;
    this.errors = data.errors;
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  timeoutMs?: number;
  _isRetry?: boolean;
}

type TokenRefresher = () => Promise<string>;
let tokenRefresher: TokenRefresher | null = null;

export function registerTokenRefresher(refresher: TokenRefresher) {
  tokenRefresher = refresher;
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    requiresAuth = true,
    headers = {},
    timeoutMs = 10000,
    signal,
    ...customConfig
  } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    ...(headers as Record<string, string>),
  };

  if (requiresAuth && !requestHeaders.Authorization) {
    const token = await authStorage.getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // Ensure leading slash
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  console.log(`[API Request] ${options.method || "GET"} ${url}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...customConfig,
      headers: requestHeaders,
      credentials: "include", // send and receive HttpOnly cookies
      signal: signal || controller.signal,
    });
  } catch (error: any) {
    console.error(`[API Error] ${url}:`, error?.message || error);
    const isTimeout =
      error?.name === "AbortError" ||
      String(error?.message).toLowerCase().includes("canceled") ||
      String(error?.message).toLowerCase().includes("aborted");

    if (isTimeout) {
      throw new ApiError({
        timestamp: new Date().toISOString(),
        status: 408,
        code: "TIMEOUT_ERROR",
        message: `Quá thời gian chờ (10s) tới ${url}. Thiết bị không thể kết nối đến IP máy chủ này.`,
        path: cleanEndpoint,
      });
    }
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: 0,
      code: "NETWORK_ERROR",
      message: `Không thể kết nối đến máy chủ (${url}). ${error?.message || "Vui lòng kiểm tra lại mạng."}`,
      path: cleanEndpoint,
    });
  } finally {
    clearTimeout(timer);
  }

  if (
    response.status === 401 &&
    requiresAuth &&
    !options._isRetry &&
    tokenRefresher
  ) {
    const newToken = await tokenRefresher();
    return await request<T>(endpoint, {
      ...options,
      _isRetry: true,
      headers: {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      },
    });
  }

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!response.ok) {
    if (isJson) {
      const errorData: ApiErrorResponse = await response.json();
      throw new ApiError(errorData);
    }
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: response.status,
      code: "HTTP_ERROR",
      message: `Yêu cầu thất bại với mã lỗi ${response.status}`,
      path: cleanEndpoint,
    });
  }

  if (isJson) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

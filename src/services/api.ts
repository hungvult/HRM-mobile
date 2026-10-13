import { API_BASE_URL } from "../constants";
import { ApiErrorResponse } from "../types";
import { authStorage } from "./auth-storage";

export class ApiError extends Error {
  public status: number;
  public code: string;
  public timestamp?: string;
  public errors?: Array<{ field: string; message: string }>;
  public traceId?: string;

  constructor(data: ApiErrorResponse) {
    super(data.message || "Đã có lỗi xảy ra.");
    this.name = "ApiError";
    this.status = data.status;
    this.code = data.code;
    this.timestamp = data.timestamp;
    this.errors = data.errors;
    this.traceId = data.traceId;
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
  options: RequestOptions = {},
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
  const method = options.method || "GET";

  console.log(`[API Request] ${method} ${url}`);
  const startTime = Date.now();

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
    const duration = Date.now() - startTime;
    const isTimeout =
      error?.name === "AbortError" ||
      String(error?.message).toLowerCase().includes("canceled") ||
      String(error?.message).toLowerCase().includes("aborted");

    if (isTimeout) {
      console.warn(
        `[API Network Error] ${method} ${url} (${duration}ms) | Quá thời gian kết nối (Timeout)`,
      );
      throw new ApiError({
        timestamp: new Date().toISOString(),
        status: 408,
        code: "TIMEOUT_ERROR",
        message: "Quá thời gian kết nối đến máy chủ. Vui lòng thử lại sau.",
        path: cleanEndpoint,
      });
    }
    console.error(
      `[API Network Error] ${method} ${url} (${duration}ms):`,
      error?.message || error,
    );
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: 0,
      code: "NETWORK_ERROR",
      message:
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.",
      path: cleanEndpoint,
    });
  } finally {
    clearTimeout(timer);
  }

  const duration = Date.now() - startTime;

  if (
    response.status === 401 &&
    requiresAuth &&
    !options._isRetry &&
    tokenRefresher
  ) {
    console.warn(
      `[API Auth] 401 ${method} ${url} (${duration}ms) -> Thử làm mới token...`,
    );
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
    console.log(`[API Response] 204 ${method} ${url} (${duration}ms)`);
    return {} as T;
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!response.ok) {
    if (isJson) {
      const errorData: ApiErrorResponse = await response.json();
      const traceSuffix = errorData.traceId
        ? ` | TraceID: ${errorData.traceId}`
        : "";
      console.error(
        `[API Error] ${response.status} ${method} ${url} (${duration}ms) | ${errorData.code || "UNKNOWN"}: ${errorData.message || "No message"}${traceSuffix}`,
      );
      throw new ApiError(errorData);
    }
    console.error(
      `[API Error] ${response.status} ${method} ${url} (${duration}ms) | HTTP_${response.status}`,
    );
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: response.status,
      code: "HTTP_ERROR",
      message: `Yêu cầu thất bại với mã lỗi ${response.status}`,
      path: cleanEndpoint,
    });
  }

  console.log(
    `[API Response] ${response.status} ${method} ${url} (${duration}ms)`,
  );

  if (isJson) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

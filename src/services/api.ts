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
  responseType?: "blob";
}

type TokenRefresher = () => Promise<string>;
let tokenRefresher: TokenRefresher | null = null;

// API của phiên cũ phải dừng sau logout, kể cả khi đang chờ SecureStore, refresh hoặc body phản hồi.
export function assertCurrentAuthSession(version: number) {
  if (!authStorage.isCurrentSession(version)) {
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: 401,
      code: "AUTH_SESSION_ENDED",
      message: "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.",
    });
  }
}

export function registerTokenRefresher(refresher: TokenRefresher) {
  tokenRefresher = refresher;
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const sessionVersion = authStorage.getSessionVersion();
  const {
    requiresAuth = true,
    headers = {},
    timeoutMs = 10000,
    signal,
    responseType,
    ...customConfig
  } = options;

  const requestHeaders: Record<string, string> = {
    // FormData tự sinh boundary; đặt JSON Content-Type sẽ làm backend không đọc được các phần ảnh/đơn.
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json; charset=utf-8" }),
    ...(headers as Record<string, string>),
  };

  if (requiresAuth && !requestHeaders.Authorization) {
    const token = await authStorage.getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // Kiểm tra sau khi đọc token vì logout có thể xảy ra trong lúc SecureStore đang đọc.
  if (requiresAuth) assertCurrentAuthSession(sessionVersion);

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

  // Không refresh hoặc trả dữ liệu cho màn hình đã thuộc một phiên khác.
  if (requiresAuth) assertCurrentAuthSession(sessionVersion);

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
    if (requiresAuth) assertCurrentAuthSession(sessionVersion);
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

  // Ảnh riêng tư dùng cùng bearer/refresh và kiểm tra phiên cả sau khi đọc hết nội dung nhị phân.
  if (responseType === "blob") {
    const payload = await response.blob();
    if (requiresAuth) assertCurrentAuthSession(sessionVersion);
    return payload as T;
  }

  if (isJson) {
    const payload = await response.json();
    if (requiresAuth) assertCurrentAuthSession(sessionVersion);
    return payload as T;
  }

  const payload = await response.text();
  if (requiresAuth) assertCurrentAuthSession(sessionVersion);
  return payload as unknown as T;
}

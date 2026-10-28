import { useCallback, useEffect, useState } from "react";
import { Linking, Platform } from "react-native";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { attendanceService } from "../services";
import {
  AttendanceActionResponse,
  AttendanceLocationRequest,
  TodayAttendance,
} from "../types";
import { toAttendanceLocation } from "../utils/attendance-location";
import { ApiError } from "../services/api";
import { getFriendlyErrorMessage } from "../utils";

export type AttendanceErrorType =
  | "WIFI_INVALID"
  | "LOCATION_OUTSIDE"
  | "GPS_INVALID"
  | "ALREADY_CHECKED"
  | "FORBIDDEN"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface AttendanceErrorDetail {
  type: AttendanceErrorType;
  message: string;
  canRetry: boolean;
}

export interface AttendanceHookReturn {
  todayData: TodayAttendance | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
  errorDetail: AttendanceErrorDetail | null;
  hasLocationPermission: boolean | null;
  isGpsEnabled: boolean;
  isLocationReady: boolean;
  isWifiConnected: boolean;
  hasShift: boolean;
  refresh: () => Promise<void>;
  requestLocationPermission: () => Promise<boolean>;
  enableLocationService: () => Promise<boolean>;
  clearError: () => void;
  checkIn: () => Promise<AttendanceActionResponse>;
  checkOut: () => Promise<AttendanceActionResponse>;
}

export function useAttendance(): AttendanceHookReturn {
  const [todayData, setTodayData] = useState<TodayAttendance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<AttendanceErrorDetail | null>(
    null,
  );

  const [hasLocationPermission, setHasLocationPermission] = useState<
    boolean | null
  >(null);
  const [isGpsEnabled, setIsGpsEnabled] = useState<boolean>(true);
  const [isWifiConnected, setIsWifiConnected] = useState<boolean>(true);

  // Check network state
  const checkNetwork = useCallback(async () => {
    try {
      const netState = await Network.getNetworkStateAsync();
      setIsWifiConnected(netState.type === Network.NetworkStateType.WIFI);
    } catch {
      setIsWifiConnected(false);
    }
  }, []);

  // Check location permission & services
  const checkPermissionAndServices = useCallback(async () => {
    try {
      const [{ status }, servicesEnabled] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.hasServicesEnabledAsync(),
      ]);
      const granted = status === Location.PermissionStatus.GRANTED;
      setHasLocationPermission(granted);
      setIsGpsEnabled(servicesEnabled);
      return granted && servicesEnabled;
    } catch {
      setHasLocationPermission(false);
      setIsGpsEnabled(false);
      return false;
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === Location.PermissionStatus.GRANTED;
      setHasLocationPermission(granted);

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      setIsGpsEnabled(servicesEnabled);

      return granted && servicesEnabled;
    } catch {
      setHasLocationPermission(false);
      return false;
    }
  }, []);

  const enableLocationService = useCallback(async () => {
    try {
      let granted = hasLocationPermission;
      if (!granted) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        granted = status === Location.PermissionStatus.GRANTED;
        setHasLocationPermission(granted);
      }

      let servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (Platform.OS === "android" && Location.enableNetworkProviderAsync) {
          try {
            await Location.enableNetworkProviderAsync();
            servicesEnabled = await Location.hasServicesEnabledAsync();
          } catch {
            // User rejected enable prompt
          }
        } else if (Platform.OS === "ios") {
          try {
            await Linking.openSettings();
          } catch {
            // Open settings failed
          }
        }
      }
      setIsGpsEnabled(servicesEnabled);
      return Boolean(granted && servicesEnabled);
    } catch {
      return false;
    }
  }, [hasLocationPermission]);

  // Fetch today attendance
  const fetchToday = useCallback(async () => {
    try {
      const data = await attendanceService.getTodayAttendance();
      setTodayData(data);
      return data;
    } catch (err: any) {
      if (err instanceof ApiError) {
        const friendlyMsg = getFriendlyErrorMessage(
          err,
          "Không thể tải trạng thái chấm công.",
        );
        setError(friendlyMsg);
        if (err.status === 403) {
          setErrorDetail({
            type: "FORBIDDEN",
            message: friendlyMsg,
            canRetry: false,
          });
        } else if (
          err.status === 408 ||
          err.status === 0 ||
          err.code === "NETWORK_ERROR" ||
          err.code === "TIMEOUT_ERROR"
        ) {
          setErrorDetail({
            type: "NETWORK_ERROR",
            message: friendlyMsg,
            canRetry: true,
          });
        } else if (err.status >= 500) {
          setErrorDetail({
            type: "SERVER_ERROR",
            message: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
            canRetry: true,
          });
        } else {
          setErrorDetail({
            type: "UNKNOWN",
            message: friendlyMsg,
            canRetry: true,
          });
        }
      } else {
        const msg =
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.";
        setError(msg);
        setErrorDetail({
          type: "NETWORK_ERROR",
          message: msg,
          canRetry: true,
        });
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchToday(),
      checkNetwork(),
      checkPermissionAndServices(),
    ]);
  }, [fetchToday, checkNetwork, checkPermissionAndServices]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen to network state changes in real time
  useEffect(() => {
    const subscription = Network.addNetworkStateListener((event) => {
      setIsWifiConnected(event.type === Network.NetworkStateType.WIFI);
    });
    return () => {
      subscription?.remove();
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorDetail(null);
  }, []);

  const getCurrentCoords = async (): Promise<AttendanceLocationRequest> => {
    let granted = hasLocationPermission;
    if (!granted) {
      const permResult = await requestLocationPermission();
      if (!permResult) {
        throw new ApiError({
          timestamp: new Date().toISOString(),
          status: 400,
          code: "ATTENDANCE_INVALID_GPS",
          message:
            "Ứng dụng cần quyền vị trí để xác thực bạn đang ở trong khuôn viên công ty.",
          path: "/attendance/location",
        });
      }
      granted = true;
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    setIsGpsEnabled(servicesEnabled);
    if (!servicesEnabled) {
      throw new ApiError({
        timestamp: new Date().toISOString(),
        status: 400,
        code: "ATTENDANCE_INVALID_GPS",
        message:
          "Vui lòng bật định vị GPS trên thiết bị để thực hiện chấm công.",
        path: "/attendance/location",
      });
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const location = toAttendanceLocation(pos);
    if (!location) {
      throw new ApiError({
        timestamp: new Date().toISOString(),
        status: 400,
        code: "ATTENDANCE_INVALID_GPS",
        message:
          "Chưa lấy được vị trí GPS hợp lệ. Vui lòng thử lại ở nơi có tín hiệu tốt hơn.",
        path: "/attendance/location",
      });
    }
    return location;
  };

  const handleApiError = async (err: any) => {
    if (err instanceof ApiError) {
      const friendlyMsg = getFriendlyErrorMessage(err);

      // Nhóm 2: Xung đột trạng thái (409) -> Tự động gọi GET /today để đồng bộ UI
      if (
        err.code === "ATTENDANCE_ALREADY_CHECKED_IN" ||
        err.code === "ATTENDANCE_ALREADY_CHECKED_OUT" ||
        err.code === "ATTENDANCE_CHECK_IN_REQUIRED" ||
        err.status === 409
      ) {
        await fetchToday();
        setErrorDetail({
          type: "ALREADY_CHECKED",
          message: friendlyMsg,
          canRetry: false,
        });
        setError(friendlyMsg);
        return;
      }

      // Nhóm 1: Sai Wi-Fi công ty (403)
      if (err.code === "ATTENDANCE_INVALID_COMPANY_WIFI") {
        const msg =
          "Thiết bị chưa kết nối Wi-Fi hợp lệ của công ty. Vui lòng kết nối đúng mạng Wi-Fi văn phòng.";
        setErrorDetail({
          type: "WIFI_INVALID",
          message: msg,
          canRetry: true,
        });
        setError(msg);
        return;
      }

      // Nhóm 1: Ngoài bán kính Geofence (403)
      if (
        err.code === "ATTENDANCE_OUTSIDE_WORK_LOCATION" ||
        err.code?.startsWith("ATTENDANCE_OUTSIDE_WORK_LOCATION")
      ) {
        const msg = "Bạn đang ở ngoài khu vực làm việc cho phép của văn phòng.";
        setErrorDetail({
          type: "LOCATION_OUTSIDE",
          message: msg,
          canRetry: true,
        });
        setError(msg);
        return;
      }

      // Nhóm 1: Lỗi GPS (400)
      if (err.code === "ATTENDANCE_INVALID_GPS") {
        setErrorDetail({
          type: "GPS_INVALID",
          message: friendlyMsg,
          canRetry: true,
        });
        setError(friendlyMsg);
        return;
      }

      // Nhóm 3: Lỗi quyền hoặc tài khoản nhân viên (403 Forbidden)
      if (
        err.status === 403 ||
        err.code === "ATTENDANCE_EMPLOYEE_NOT_FOUND" ||
        err.code === "ATTENDANCE_EMPLOYEE_INACTIVE" ||
        err.code === "AUTH_FORBIDDEN" ||
        err.code === "FORBIDDEN"
      ) {
        setErrorDetail({
          type: "FORBIDDEN",
          message: friendlyMsg,
          canRetry: false,
        });
        setError(friendlyMsg);
        return;
      }

      // Nhóm 4: Mạng / Timeout (0, 408)
      if (
        err.status === 0 ||
        err.status === 408 ||
        err.code === "NETWORK_ERROR" ||
        err.code === "TIMEOUT_ERROR"
      ) {
        setErrorDetail({
          type: "NETWORK_ERROR",
          message: friendlyMsg,
          canRetry: true,
        });
        setError(friendlyMsg);
        return;
      }

      // Nhóm 5: Máy chủ gặp sự cố (500)
      if (err.status >= 500) {
        setErrorDetail({
          type: "SERVER_ERROR",
          message: "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
          canRetry: true,
        });
        setError("Hệ thống đang gặp sự cố. Vui lòng thử lại sau.");
        return;
      }

      // Nhóm 6: Lỗi khác
      setErrorDetail({
        type: "UNKNOWN",
        message: friendlyMsg,
        canRetry: true,
      });
      setError(friendlyMsg);
      return;
    }

    // Default error
    const msg = getFriendlyErrorMessage(err);
    setError(msg);
    setErrorDetail({
      type: "UNKNOWN",
      message: msg,
      canRetry: true,
    });
  };

  const checkIn = async (): Promise<AttendanceActionResponse> => {
    setIsActionLoading(true);
    clearError();
    try {
      const coords = await getCurrentCoords();
      const res = await attendanceService.checkIn(coords);
      await fetchToday();
      return res;
    } catch (err: any) {
      await handleApiError(err);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const checkOut = async (): Promise<AttendanceActionResponse> => {
    setIsActionLoading(true);
    clearError();
    try {
      const coords = await getCurrentCoords();
      const res = await attendanceService.checkOut(coords);
      await fetchToday();
      return res;
    } catch (err: any) {
      await handleApiError(err);
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const isLocationReady = Boolean(hasLocationPermission && isGpsEnabled);
  const hasShift = todayData ? todayData.attendanceStatus !== "HOLIDAY" : true;

  return {
    todayData,
    isLoading,
    isActionLoading,
    error,
    errorDetail,
    hasLocationPermission,
    isGpsEnabled,
    isLocationReady,
    isWifiConnected,
    hasShift,
    refresh,
    requestLocationPermission,
    enableLocationService,
    clearError,
    checkIn,
    checkOut,
  };
}

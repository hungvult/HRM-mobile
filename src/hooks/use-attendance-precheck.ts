import { useCallback } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { attendanceService } from "../services/attendance-service";
import { authStorage } from "../services/auth-storage";
import { assertCurrentAuthSession } from "../services/api";
import { toAttendanceLocation } from "../utils/attendance-location";
import { optionalAttendanceLocation } from "../utils/optional-attendance-location";

// Expo không hủy được promise lấy GPS một lần. Giữ cờ chung qua blur/refocus/remount để không chồng yêu cầu native.
// Cờ chỉ giữ trạng thái tài nguyên, không chứa tọa độ hoặc kết quả xác minh của tài khoản nào.
let nativeGpsPending = false;

// Dùng riêng ở màn chấm công: app thu GPS và gửi bằng phiên đăng nhập hiện tại, BE xác minh IP/GPS.
// Chỉ chạy khi màn được focus và app ở foreground; không xin quyền mới, không hiện lỗi hoặc đổi trạng thái nút.
// Mỗi lượt tự lấy mẫu mới. Kết quả không được lưu làm quyền ghi công; thao tác check-in/out giữ nguyên luồng cũ.
export function useAttendancePrecheck(): void {
  useFocusEffect(
    useCallback(() => {
      let disposed = false;
      let active = AppState.currentState === "active";
      let revision = 0;
      let inFlight = false;
      let pending = false;
      let lastStartedAt = 0;
      let debounce: ReturnType<typeof setTimeout> | undefined;
      let interval: ReturnType<typeof setInterval> | undefined;
      let controller: AbortController | undefined;
      let watcher: Location.LocationSubscription | undefined;
      let watcherStarting = false;

      // Chỉ theo dõi khi người dùng đã cho quyền và bật GPS. Đổi mạng/rời màn làm mẫu đang lấy hết hiệu lực.
      // Việc tạo watcher có thể hoàn tất muộn; revision buộc watcher cũ tự gỡ thay vì tiếp tục gửi GPS.
      const ensureWatcher = async () => {
        if (watcher || watcherStarting || !active || disposed) return;
        watcherStarting = true;
        const expected = revision;
        try {
          const [permission, enabled] = await Promise.all([
            Location.getForegroundPermissionsAsync(),
            Location.hasServicesEnabledAsync(),
          ]);
          if (!active || disposed || expected !== revision) return;
          if (
            permission.status !== Location.PermissionStatus.GRANTED ||
            !enabled
          ) {
            return;
          }
          const subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              mayShowUserSettingsDialog: false,
              distanceInterval: 25,
              timeInterval: 30_000,
            },
            () => {
              // GPS thay đổi thì lấy mẫu hiện tại để gửi; giới hạn tần suất khi thiết bị báo vị trí liên tục.
              if (Date.now() - lastStartedAt >= 5_000) schedule(false);
            },
            () => {
              watcher?.remove();
              watcher = undefined;
            },
          );
          if (disposed || !active || expected !== revision)
            subscription.remove();
          else watcher = subscription;
        } catch {
          // GPS không sẵn sàng vẫn cho BE xét bằng chứng mạng bằng body {}; không đưa lỗi nền ra giao diện.
        } finally {
          watcherStarting = false;
        }
      };

      // Một lượt chỉ gửi một yêu cầu đọc điều kiện. Không tự gọi check-in/out, không ghi công hay tự retry thao tác ghi.
      // Session và revision được kiểm lại sau chờ GPS để mẫu của tài khoản/mạng cũ không dùng cho lượt mới.
      const run = async () => {
        if (disposed || !active || inFlight) return;
        inFlight = true;
        pending = false;
        lastStartedAt = Date.now();
        const expected = revision;
        const session = authStorage.getSessionVersion();
        const abort = new AbortController();
        controller = abort;
        let deadline: ReturnType<typeof setTimeout> | undefined;
        let collecting = true;
        try {
          assertCurrentAuthSession(session);
          void ensureWatcher();
          const location = await optionalAttendanceLocation(async () => {
            const [permission, enabled] = await Promise.all([
              Location.getForegroundPermissionsAsync(),
              Location.hasServicesEnabledAsync(),
            ]);
            // Quyền GPS có thể trả về sau khi rời màn, đổi phiên/mạng hoặc hết thời gian lấy mẫu.
            // Không khởi chạy thêm yêu cầu native trong các trường hợp đó; mẫu native đang chờ cũng không được dùng lại.
            if (
              !collecting ||
              disposed ||
              !active ||
              expected !== revision ||
              abort.signal.aborted ||
              nativeGpsPending
            )
              throw new Error("GPS_UNAVAILABLE");
            assertCurrentAuthSession(session);
            if (
              permission.status !== Location.PermissionStatus.GRANTED ||
              !enabled
            )
              throw new Error("GPS_UNAVAILABLE");
            nativeGpsPending = true;
            try {
              const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                mayShowUserSettingsDialog: false,
              });
              // Chỉ chuẩn hóa nhóm trường gửi API, không tự so tọa độ/IP với cấu hình công ty trên app.
              const evidence = toAttendanceLocation(position);
              if (!evidence) throw new Error("GPS_UNAVAILABLE");
              return evidence;
            } finally {
              // Timeout không hủy được native promise; giữ cờ đến khi native kết thúc để không chồng nhiều lượt GPS.
              nativeGpsPending = false;
            }
          });
          collecting = false;
          if (
            disposed ||
            !active ||
            expected !== revision ||
            abort.signal.aborted
          )
            return;
          assertCurrentAuthSession(session);
          // API dùng signal bên ngoài nên lượt nền tự đặt hạn hủy, tránh treo khi mạng mất kết nối.
          deadline = setTimeout(() => abort.abort(), 8_000);
          await attendanceService.preCheck(location, abort.signal);
        } catch {
          // Kết quả lỗi chỉ kết thúc lượt kiểm tra ngầm; lần bấm vẫn gửi bằng chứng mới và nhận lỗi nghiệp vụ như cũ.
        } finally {
          collecting = false;
          if (deadline) clearTimeout(deadline);
          if (controller === abort) controller = undefined;
          inFlight = false;
          if (pending && active && !disposed) schedule(false);
        }
      };

      // Gộp các sự kiện gần nhau thành một lượt. Đổi mạng hủy yêu cầu cũ và chỉ giữ một lượt mới đang chờ.
      const schedule = (invalidate: boolean) => {
        if (disposed || !active) return;
        if (invalidate) {
          revision += 1;
          controller?.abort();
          watcher?.remove();
          watcher = undefined;
        }
        pending = true;
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(() => {
          void run();
        }, 250);
      };

      // Dừng lập lịch, watcher và HTTP của lượt cũ. GPS native đã khởi chạy có thể trả muộn nhưng không được gửi đi.
      const stop = () => {
        revision += 1;
        pending = false;
        if (debounce) clearTimeout(debounce);
        if (interval) clearInterval(interval);
        controller?.abort();
        watcher?.remove();
        watcher = undefined;
      };
      const start = () => {
        schedule(true);
        // Bắt cả đổi IP WAN hoặc bật GPS khi vẫn ở màn này mà hệ điều hành không phát sự kiện đổi mạng.
        interval = setInterval(() => schedule(false), 30_000);
      };

      const network = Network.addNetworkStateListener(() => schedule(true));
      const lifecycle = AppState.addEventListener("change", (state) => {
        const nextActive = state === "active";
        if (nextActive === active) return;
        active = nextActive;
        if (active) start();
        else stop();
      });
      if (active) start();
      return () => {
        disposed = true;
        stop();
        network.remove();
        lifecycle.remove();
      };
    }, []),
  );
}

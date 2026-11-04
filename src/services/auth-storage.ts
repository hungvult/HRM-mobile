import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "access_token";
const LOGGED_OUT_KEY = "auth_logged_out";
const REMEMBER_KEY = "auth_remember_session";
let sessionVersion = 0;
let signedOut = false;
let memoryToken: string | null = null;
let rememberSession = true;
let storageQueue: Promise<unknown> = Promise.resolve();

// SecureStore ghi bất đồng bộ. Xếp hàng thao tác để ghi token đang chạy phải kết thúc trước lượt xóa phiên.
function serializeStorage<T>(action: () => Promise<T>): Promise<T> {
  const operation = storageQueue.then(action);
  storageQueue = operation.catch(() => undefined);
  return operation;
}

export const authStorage = {
  // Mã phiên cục bộ đổi khi kết thúc phiên; request giữ mã này để nhận ra phản hồi của tài khoản cũ.
  getSessionVersion(): number {
    return sessionVersion;
  },

  isCurrentSession(version: number): boolean {
    return version === sessionVersion && !signedOut;
  },

  // Chỉ login mới được bỏ dấu đăng xuất; refresh cũ không được lưu token hoặc mở lại phiên.
  async saveToken(
    token: string,
    version = sessionVersion,
    newSession = false,
    remember = rememberSession,
  ): Promise<boolean> {
    return serializeStorage(async () => {
      if (version !== sessionVersion || (signedOut && !newSession))
        return false;
      // Phiên mới ghi lựa chọn trước; nếu không ghi nhớ, xóa token cũ thay vì lưu token phiên hiện tại.
      if (newSession) {
        await SecureStore.setItemAsync(REMEMBER_KEY, "0");
        if (version !== sessionVersion) return false;
      }
      if (remember) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        if (version !== sessionVersion) return false;
        await SecureStore.setItemAsync(REMEMBER_KEY, "1");
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
      if (version !== sessionVersion) return false;
      if (newSession) {
        await SecureStore.deleteItemAsync(LOGGED_OUT_KEY);
        if (version !== sessionVersion) return false;
        signedOut = false;
      }
      // Token trong bộ nhớ phục vụ mọi API của phiên hiện tại, kể cả khi không lưu qua lần mở app sau.
      rememberSession = remember;
      memoryToken = token;
      return true;
    });
  },

  // Đọc cả dấu đăng xuất để app mở lại sau lỗi mạng không dùng cookie cũ tự đăng nhập.
  async getToken(): Promise<string | null> {
    const version = sessionVersion;
    if (signedOut) return null;
    return serializeStorage(async () => {
      if (version !== sessionVersion || signedOut) return null;
      if ((await SecureStore.getItemAsync(LOGGED_OUT_KEY)) === "1") {
        signedOut = true;
        return null;
      }
      if (memoryToken) return memoryToken;
      // Cookie refresh không đủ để mở phiên khi người dùng đã chọn không ghi nhớ.
      if ((await SecureStore.getItemAsync(REMEMBER_KEY)) === "0") {
        // Sau khởi động lại, chặn cả refresh do API nền kích hoạt, không chỉ bỏ qua bước khôi phục UI.
        signedOut = true;
        return null;
      }
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (authStorage.isCurrentSession(version)) {
        memoryToken = token;
        rememberSession = true;
      }
      return authStorage.isCurrentSession(version) ? token : null;
    });
  },

  // Chặn phiên ngay trong bộ nhớ, rồi lưu dấu và xóa token tuần tự. Trả token cũ chỉ để gọi API hủy phiên.
  beginLogout(): Promise<string | null> {
    const previousToken = memoryToken;
    sessionVersion += 1;
    signedOut = true;
    memoryToken = null;
    return serializeStorage(async () => {
      let token: string | null = null;
      try {
        token = previousToken ?? (await SecureStore.getItemAsync(TOKEN_KEY));
      } finally {
        // Cố xóa token cả khi đọc token hoặc ghi dấu thất bại, để lỗi SecureStore không giữ lại phiên cũ.
        try {
          await SecureStore.setItemAsync(LOGGED_OUT_KEY, "1");
        } finally {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
      return token;
    });
  },

  async removeToken(): Promise<void> {
    await authStorage.clearAuth();
  },

  async clearAuth(): Promise<void> {
    await authStorage.beginLogout();
  },
};

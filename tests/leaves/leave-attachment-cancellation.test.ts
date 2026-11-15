import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Platform } from "react-native";
import { File as FileSystemFile } from "expo-file-system";
import { convertFormDataAsync } from "../../node_modules/expo/src/winter/fetch/convertFormData";
import type { LeaveAttachmentUpload } from "@/types/leave";

const session = vi.hoisted(() => ({ version: 1, active: true }));
vi.mock("@/services/auth-storage", () => ({
  authStorage: {
    getSessionVersion: () => session.version,
    isCurrentSession: (version: number) =>
      session.active && version === session.version,
    getToken: vi.fn(async () => "memory-only-token"),
  },
}));

import { registerTokenRefresher } from "@/services/api";
import { leaveService } from "@/services/leave-service";

const payload = {
  leaveTypeId: 2,
  startDate: "2026-11-27",
  endDate: "2026-11-30",
  reason: "Nghỉ để chăm sóc gia đình",
};
const attachment: LeaveAttachmentUpload = {
  uri: "file:///evidence.png",
  fileName: "evidence.png",
  contentType: "image/png",
  sizeBytes: 8,
};
const originalOS = Platform.OS;
const jsonResponse = (data: unknown = {}) => ({
  ok: true,
  status: 200,
  headers: new Headers({ "content-type": "application/json" }),
  json: async () => data,
});

beforeEach(() => {
  session.version = 1;
  session.active = true;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse()));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(Platform, "OS", {
    configurable: true,
    value: originalOS,
  });
});

describe("UC013 multipart và transport", () => {
  it("không có ảnh giữ nguyên JSON và bearer của phiên trong bộ nhớ", async () => {
    await leaveService.createLeaveRequest(payload);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/leave-requests"),
      expect.objectContaining({
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          Authorization: "Bearer memory-only-token",
          "Content-Type": "application/json; charset=utf-8",
        }),
      }),
    );
  });
  it("Android đóng gói JSON tiếng Việt và byte ảnh bằng bộ chuyển đổi Expo 57 thật", async () => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      value: "android",
    });
    // FormData React Native giữ các object trong _parts; không dùng FormData trình duyệt vốn ép chúng thành chuỗi.
    class NativeFormData {
      _parts: [string, unknown][] = [];
      append(name: string, value: unknown, filename?: string) {
        if (value instanceof Blob && filename)
          Object.defineProperty(value, "name", {
            value: filename,
            configurable: true,
          });
        this._parts.push([name, value]);
      }
      entries() {
        return this._parts[Symbol.iterator]();
      }
    }
    vi.stubGlobal("FormData", NativeFormData);
    await leaveService.createLeaveRequest(payload, attachment);
    const options = vi.mocked(fetch).mock.calls[0][1]!;
    const form = options.body as unknown as NativeFormData;
    expect(form._parts.map(([name]) => name)).toEqual([
      "request",
      "attachment",
    ]);
    const { body, boundary } = await convertFormDataAsync(
      options.body as FormData,
      "qa-boundary",
    );
    const text = new TextDecoder().decode(body);
    expect(boundary).toBe("qa-boundary");
    expect(text).toContain('name="request"; filename="request.json"');
    expect(text).toContain("content-type: application/json");
    expect(text).toContain(JSON.stringify(payload));
    expect(text).toContain('name="attachment"; filename="evidence.png"');
    expect(text).toContain("content-type: image/png");
    expect(
      Buffer.from(body).includes(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      ),
    ).toBe(true);
    expect(options.headers).toEqual({
      Authorization: "Bearer memory-only-token",
    });
  });
  it("Expo thật từ chối phần uri/type/name cũ, tái hiện lỗi trước khi tới VPS", async () => {
    const form = {
      entries: () => [
        [
          "attachment",
          {
            uri: attachment.uri,
            type: attachment.contentType,
            name: attachment.fileName,
          },
        ],
      ],
    } as unknown as FormData;
    await expect(convertFormDataAsync(form)).rejects.toThrow(
      "Unsupported FormDataPart implementation",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
  it("file cache mất hoặc vượt 5 MB dừng trước khi gửi đơn", async () => {
    vi.spyOn(FileSystemFile.prototype, "exists", "get").mockReturnValue(false);
    await expect(
      leaveService.createLeaveRequest(payload, attachment),
    ).rejects.toThrow("Không đọc được ảnh");
    vi.restoreAllMocks();
    vi.spyOn(FileSystemFile.prototype, "size", "get").mockReturnValue(
      5 * 1024 * 1024 + 1,
    );
    await expect(
      leaveService.createLeaveRequest(payload, attachment),
    ).rejects.toThrow("5 MB");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("Web gửi JSON Blob và File vào đúng hai phần multipart", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
    const file = new File(["evidence"], "photo.png", { type: "image/png" });
    await leaveService.createLeaveRequest(payload, { ...attachment, file });
    const options = vi.mocked(fetch).mock.calls[0][1]!;
    const form = options.body as FormData;
    const requestPart = form.get("request") as File;
    expect(requestPart.type).toBe("application/json");
    expect(JSON.parse(await requestPart.text())).toEqual(payload);
    expect((form.get("attachment") as File).type).toBe("image/png");
    expect(options.headers).toEqual({
      Authorization: "Bearer memory-only-token",
    });
  });
  it("không tự retry POST tạo khi mạng lỗi", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("offline"));
    await expect(
      leaveService.createLeaveRequest(payload),
    ).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("UC014 lý do hủy tùy chọn", () => {
  it.each([undefined, "", "   \n "])(
    "body vắng với lý do trống %s giữ hợp đồng cũ",
    async (reason) => {
      await leaveService.cancelLeaveRequest(42, reason);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/leave-requests/42/cancel"),
        expect.objectContaining({ method: "POST", body: undefined }),
      );
    },
  );
  it("trim lý do và nhận note mới từ lịch sử", async () => {
    const result = {
      status: "CANCELLED",
      statusHistory: [{ newStatus: "CANCELLED", note: "Đổi lịch cá nhân" }],
    };
    vi.mocked(fetch).mockResolvedValue(jsonResponse(result) as Response);
    expect(
      await leaveService.cancelLeaveRequest(42, "  Đổi lịch cá nhân \n"),
    ).toEqual(result);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ reason: "Đổi lịch cá nhân" }),
      }),
    );
  });
  it("cho phép 1000 ký tự và chặn 1001 trước khi gọi API", async () => {
    await leaveService.cancelLeaveRequest(42, "a".repeat(1000));
    await expect(
      leaveService.cancelLeaveRequest(42, "a".repeat(1001)),
    ).rejects.toThrow("1.000");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("không refresh/gửi lại POST tạo hoặc hủy sau 401", async () => {
    const refresher = vi.fn(async () => "new-token");
    registerTokenRefresher(refresher);
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Expired",
      }),
    } as Response);
    await expect(
      leaveService.createLeaveRequest(payload),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      leaveService.cancelLeaveRequest(42, "Đổi lịch"),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(refresher).not.toHaveBeenCalled();
  });
});

describe("Ảnh riêng tư và logout", () => {
  it("tải bằng ID đơn và bearer, trả data URI không cần Image gọi URL công khai", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "image/png" }),
      blob: async () => new Blob(["png"], { type: "image/png" }),
    } as Response);
    expect(await leaveService.getAttachmentPreview(42)).toMatch(
      /^data:image\/png;base64,/,
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/leave-requests\/42\/attachment$/),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer memory-only-token",
        }),
      }),
    );
  });
  it("logout trong lúc đọc binary loại phản hồi cũ", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      blob: async () => {
        session.active = false;
        return new Blob(["png"], { type: "image/png" });
      },
    } as Response);
    await expect(leaveService.getAttachmentPreview(42)).rejects.toMatchObject({
      code: "AUTH_SESSION_ENDED",
    });
  });
  it("logout trong lúc đổi Blob sang data URI cũng loại ảnh cũ", async () => {
    class Reader {
      result = "data:image/png;base64,cG5n";
      onload?: () => void;
      readAsDataURL() {
        session.active = false;
        this.onload?.();
      }
    }
    vi.stubGlobal("FileReader", Reader);
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      blob: async () => new Blob(["png"], { type: "image/png" }),
    } as Response);
    await expect(leaveService.getAttachmentPreview(42)).rejects.toMatchObject({
      code: "AUTH_SESSION_ENDED",
    });
  });
  it("logout trong lúc lấy token không được gửi GET ảnh", async () => {
    session.active = false;
    await expect(leaveService.getAttachmentPreview(42)).rejects.toMatchObject({
      code: "AUTH_SESSION_ENDED",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("không render nội dung trả về ngoài MIME ảnh cho phép", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      blob: async () => new Blob(["html"], { type: "text/html" }),
    } as Response);
    await expect(leaveService.getAttachmentPreview(42)).rejects.toThrow(
      "không hợp lệ",
    );
  });
});

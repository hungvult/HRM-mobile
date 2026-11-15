import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LeaveRequestDetail } from "@/types/leave";

const state = vi.hoisted(() => ({
  active: true,
  routeId: "42",
  back: vi.fn(),
  alert: vi.fn(),
  picker: vi.fn(),
  appStateListener: null as null | ((state: string) => void),
  navigation: {
    addListener: vi.fn((_event: string, _callback: (event: any) => void) =>
      vi.fn(),
    ),
    dispatch: vi.fn(),
  },
  service: {
    getLeaveTypes: vi.fn(),
    getLeaveBalances: vi.fn(),
    createLeaveRequest: vi.fn(),
    getLeaveRequestDetail: vi.fn(),
    cancelLeaveRequest: vi.fn(),
    getAttachmentPreview: vi.fn(),
  },
}));

// Bộ chuyển DOM chỉ dành cho test màn nghỉ phép; không thay mock dùng chung của các worker khác.
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
  StyleSheet: { create: (styles: unknown) => styles },
  Keyboard: { addListener: () => ({ remove: () => {} }) },
  AppState: {
    addEventListener: (_: string, callback: (state: string) => void) => {
      state.appStateListener = callback;
      return {
        remove: () => {
          state.appStateListener = null;
        },
      };
    },
  },
  Alert: { alert: state.alert },
  View: ({ children }: any) => <div>{children}</div>,
  Text: ({ children }: any) => <span>{children}</span>,
  ScrollView: ({ children }: any) => <div>{children}</div>,
  KeyboardAvoidingView: ({ children }: any) => <div>{children}</div>,
  Pressable: ({ children, onPress, disabled }: any) => (
    <button disabled={disabled} onClick={onPress}>
      {children}
    </button>
  ),
  Modal: ({ children, visible }: any) =>
    visible ? <div role="dialog">{children}</div> : null,
  Image: ({ source, accessibilityLabel }: any) => (
    <img src={source.uri} alt={accessibilityLabel} />
  ),
  TextInput: () => null,
  ActivityIndicator: () => <span>Loading</span>,
  RefreshControl: () => null,
}));
vi.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
vi.mock("expo-image-picker", () => ({ launchImageLibraryAsync: state.picker }));
vi.mock("expo-router", () => ({
  useRouter: () => ({ back: state.back }),
  useNavigation: () => state.navigation,
  useLocalSearchParams: () => ({ id: state.routeId }),
}));
vi.mock("@/services", () => ({
  leaveService: state.service,
  authStorage: {
    getSessionVersion: () => 1,
    isCurrentSession: () => state.active,
  },
}));
vi.mock("@/components", () => ({
  Button: ({ title, onPress, disabled, loading }: any) => (
    <button disabled={disabled || loading} onClick={onPress}>
      {title}
    </button>
  ),
  Card: ({ children }: any) => <section>{children}</section>,
  Input: ({
    label,
    value,
    onChangeText,
    multiline,
    error,
    helperText,
    editable,
    maxLength,
  }: any) => (
    <label>
      {label}
      {multiline ? (
        <textarea
          aria-label={label}
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          disabled={editable === false}
          maxLength={maxLength}
        />
      ) : (
        <input
          aria-label={label}
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          disabled={editable === false}
        />
      )}
      {error ? <span role="alert">{error}</span> : null}
      <span>{helperText}</span>
    </label>
  ),
  InfoField: ({ label, value }: any) => (
    <div>
      {label}: {value}
    </div>
  ),
  DatePickerModal: () => null,
}));

import { CreateLeaveScreen } from "@/screens/leaves/create-leave-screen";
import { LeaveDetailScreen } from "@/screens/leaves/leave-detail-screen";

const detail: LeaveRequestDetail = {
  id: 42,
  requestCode: "NP000042",
  employeeId: 7,
  employeeCode: "NV07",
  employeeName: "Nhân viên QA",
  leaveTypeId: 2,
  leaveTypeCode: "UNPAID",
  leaveTypeName: "Không hưởng lương",
  startDate: "2026-12-04",
  endDate: "2026-12-07",
  requestedDays: 2,
  reason: "Giải quyết việc gia đình",
  status: "PENDING",
  reviewedByEmployeeId: null,
  reviewedAt: null,
  rejectionReason: null,
  cancelledAt: null,
  createdAt: "2026-11-24T10:00:00+07:00",
  updatedAt: "2026-11-24T10:00:00+07:00",
  statusHistory: [],
};
const selectedImage = {
  uri: "file:///evidence.png",
  width: 10,
  height: 10,
  mimeType: "image/png",
  fileSize: 100,
  fileName: "evidence.png",
};
const pending = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  vi.clearAllMocks();
  state.active = true;
  state.routeId = "42";
  state.service.getLeaveTypes.mockResolvedValue([
    {
      id: 2,
      code: "UNPAID",
      name: "Không hưởng lương",
      paid: false,
      annualQuotaDays: 0,
    },
  ]);
  state.service.getLeaveBalances.mockResolvedValue({ year: 2026, items: [] });
  state.service.getLeaveRequestDetail.mockResolvedValue(detail);
  state.service.getAttachmentPreview.mockResolvedValue(
    "data:image/png;base64,cG5n",
  );
  state.service.createLeaveRequest.mockResolvedValue({ id: 42 });
  state.picker.mockResolvedValue({ canceled: false, assets: [selectedImage] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function fillCreateForm() {
  await screen.findByText("Không trừ quỹ phép");
  fireEvent.change(screen.getByLabelText("Từ ngày (YYYY-MM-DD)"), {
    target: { value: "2027-01-08" },
  });
  fireEvent.change(screen.getByLabelText("Đến ngày (YYYY-MM-DD)"), {
    target: { value: "2027-01-11" },
  });
  fireEvent.change(screen.getByLabelText("Nội dung lý do *"), {
    target: { value: "Giải quyết việc gia đình" },
  });
}

describe("UC013 form nghỉ phép", () => {
  it("form đang mở qua nửa đêm cập nhật preview và chặn ngày vừa trở thành quá khứ", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    vi.setSystemTime(new Date(2026, 10, 24, 23, 59, 59));
    await act(async () => {
      render(<CreateLeaveScreen />);
    });
    expect(screen.getByText("Tổng ngày nghỉ dự kiến: 1 ngày")).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Không thể chọn ngày trong quá khứ.")).toBeTruthy();
    expect(screen.getByText("Tổng ngày nghỉ dự kiến: 0 ngày")).toBeTruthy();
    const beforeRemove = state.navigation.addListener.mock.calls.at(-1)![1];
    const event = { preventDefault: vi.fn() };
    act(() => beforeRemove(event));
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(state.alert).not.toHaveBeenCalled();
  });
  it("mở lại app sau nhiều ngày cũng kiểm tra lại ngày hiện tại", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 24, 10));
    render(<CreateLeaveScreen />);
    await screen.findByText("Không trừ quỹ phép");
    vi.setSystemTime(new Date(2026, 10, 26, 10));
    act(() => state.appStateListener?.("active"));
    expect(screen.getByText("Không thể chọn ngày trong quá khứ.")).toBeTruthy();
  });
  it("preview bao gồm thứ Sáu và thứ Hai; unpaid không cần balance, nhấn liên tiếp chỉ gửi một lần", async () => {
    const operation = pending<any>();
    state.service.createLeaveRequest.mockReturnValue(operation.promise);
    render(<CreateLeaveScreen />);
    await fillCreateForm();
    expect(screen.getByText("Tổng ngày nghỉ dự kiến: 2 ngày")).toBeTruthy();
    const button = screen.getByText("Gửi đơn nghỉ phép");
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    expect(state.service.createLeaveRequest).toHaveBeenCalledTimes(1);
    expect(state.service.createLeaveRequest).toHaveBeenCalledWith(
      expect.objectContaining({ leaveTypeId: 2 }),
      null,
    );
    await act(async () => operation.resolve({ id: 42 }));
    fireEvent.click(button);
    expect(state.service.createLeaveRequest).toHaveBeenCalledTimes(1);
  });
  it("chỉ có cuối tuần thì báo ngay tại form và không gửi", async () => {
    render(<CreateLeaveScreen />);
    await fillCreateForm();
    fireEvent.change(screen.getByLabelText("Từ ngày (YYYY-MM-DD)"), {
      target: { value: "2027-01-09" },
    });
    fireEvent.change(screen.getByLabelText("Đến ngày (YYYY-MM-DD)"), {
      target: { value: "2027-01-10" },
    });
    expect(
      screen.getByText("Khoảng thời gian đăng ký không có ngày làm việc."),
    ).toBeTruthy();
    fireEvent.click(screen.getByText("Gửi đơn nghỉ phép"));
    expect(state.service.createLeaveRequest).not.toHaveBeenCalled();
  });
  it("chọn/xem trước, thay ảnh lỗi giữ ảnh cũ, xóa ảnh rồi gửi không có attachment", async () => {
    render(<CreateLeaveScreen />);
    await fillCreateForm();
    fireEvent.click(screen.getByText("Chọn ảnh"));
    expect(await screen.findByAltText("Ảnh minh chứng đã chọn")).toHaveProperty(
      "src",
      selectedImage.uri,
    );
    state.picker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ ...selectedImage, fileSize: 6 * 1024 * 1024 }],
    });
    fireEvent.click(screen.getByText("Thay ảnh"));
    await screen.findByText("Ảnh minh chứng không được vượt quá 5 MB.");
    expect(screen.getByAltText("Ảnh minh chứng đã chọn")).toHaveProperty(
      "src",
      selectedImage.uri,
    );
    fireEvent.click(screen.getByText("Xóa ảnh"));
    expect(screen.queryByAltText("Ảnh minh chứng đã chọn")).toBeNull();
    fireEvent.click(screen.getByText("Gửi đơn nghỉ phép"));
    await waitFor(() =>
      expect(state.service.createLeaveRequest).toHaveBeenCalledWith(
        expect.any(Object),
        null,
      ),
    );
  });
  it("lỗi mạng giữ nguyên form và ảnh, không tự gửi lại", async () => {
    state.service.createLeaveRequest.mockRejectedValueOnce({
      code: "NETWORK_ERROR",
    });
    render(<CreateLeaveScreen />);
    await fillCreateForm();
    fireEvent.click(screen.getByText("Chọn ảnh"));
    await screen.findByAltText("Ảnh minh chứng đã chọn");
    fireEvent.click(screen.getByText("Gửi đơn nghỉ phép"));
    await screen.findByText(
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng. Vui lòng kiểm tra danh sách đơn trước khi gửi lại.",
    );
    expect(
      (screen.getByLabelText("Nội dung lý do *") as HTMLTextAreaElement).value,
    ).toBe("Giải quyết việc gia đình");
    expect(screen.getByAltText("Ảnh minh chứng đã chọn")).toBeTruthy();
    expect(state.service.createLeaveRequest).toHaveBeenCalledTimes(1);
  });
});

describe("UC014 modal hủy và ảnh riêng tư", () => {
  it("đóng modal không gọi API, xác nhận một lần và hiện note từ response, không thông báo hoàn quỹ unpaid", async () => {
    const operation = pending<any>();
    state.service.cancelLeaveRequest.mockReturnValue(operation.promise);
    render(<LeaveDetailScreen />);
    await screen.findByText("Hủy đơn nghỉ phép");
    fireEvent.click(screen.getByText("Hủy đơn nghỉ phép"));
    fireEvent.click(screen.getByText("Đóng"));
    expect(state.service.cancelLeaveRequest).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Hủy đơn nghỉ phép"));
    const input = screen.getByLabelText("Lý do hủy đơn (tùy chọn)");
    expect(input.getAttribute("maxlength")).toBe("1000");
    fireEvent.change(input, { target: { value: "Đổi lịch cá nhân" } });
    const button = screen.getByText("Xác nhận hủy đơn");
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    expect(state.service.cancelLeaveRequest).toHaveBeenCalledTimes(1);
    expect(state.service.cancelLeaveRequest).toHaveBeenCalledWith(
      42,
      "Đổi lịch cá nhân",
    );
    await act(async () =>
      operation.resolve({
        id: 42,
        status: "CANCELLED",
        statusHistory: [
          {
            newStatus: "CANCELLED",
            note: "Đổi lịch cá nhân",
            changedAt: "2026-11-24T10:00:00+07:00",
            changedByEmployeeName: "Nhân viên QA",
          },
        ],
      }),
    );
    expect(screen.getByText("Ghi chú: Đổi lịch cá nhân")).toBeTruthy();
    expect(screen.queryByText("Hủy đơn nghỉ phép")).toBeNull();
    expect(JSON.stringify(state.alert.mock.calls)).not.toMatch(
      /hoàn trả|hoàn quỹ/,
    );
  });
  it("hủy lỗi giữ modal/lý do và không tự retry", async () => {
    state.service.cancelLeaveRequest.mockRejectedValueOnce({
      code: "NETWORK_ERROR",
    });
    render(<LeaveDetailScreen />);
    await screen.findByText("Hủy đơn nghỉ phép");
    fireEvent.click(screen.getByText("Hủy đơn nghỉ phép"));
    fireEvent.change(screen.getByLabelText("Lý do hủy đơn (tùy chọn)"), {
      target: { value: "Lý do cần giữ" },
    });
    fireEvent.click(screen.getByText("Xác nhận hủy đơn"));
    await screen.findByText(
      "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.",
    );
    expect(
      (screen.getByLabelText("Lý do hủy đơn (tùy chọn)") as HTMLTextAreaElement)
        .value,
    ).toBe("Lý do cần giữ");
    expect(state.service.cancelLeaveRequest).toHaveBeenCalledTimes(1);
  });
  it("metadata /v1 chỉ bật tải ảnh theo ID, không đưa URL metadata vào Image", async () => {
    state.service.getLeaveRequestDetail.mockResolvedValue({
      ...detail,
      attachment: {
        fileName: "photo.png",
        contentType: "image/png",
        sizeBytes: 10,
        url: "/v1/leave-requests/42/attachment",
      },
    });
    render(<LeaveDetailScreen />);
    const image = await screen.findByAltText("Ảnh minh chứng đơn nghỉ phép");
    expect(state.service.getAttachmentPreview).toHaveBeenCalledWith(42);
    expect(image.getAttribute("src")).toMatch(/^data:image\/png/);
  });
  it("không hiện ảnh tải muộn sau logout", async () => {
    const operation = pending<string>();
    state.service.getAttachmentPreview.mockReturnValueOnce(operation.promise);
    state.service.getLeaveRequestDetail.mockResolvedValue({
      ...detail,
      attachment: {
        fileName: "photo.png",
        contentType: "image/png",
        sizeBytes: 10,
        url: "/v1/leave-requests/42/attachment",
      },
    });
    render(<LeaveDetailScreen />);
    await screen.findByText("photo.png");
    state.active = false;
    await act(async () => operation.resolve("data:image/png;base64,cG5n"));
    expect(screen.queryByAltText("Ảnh minh chứng đơn nghỉ phép")).toBeNull();
  });
});

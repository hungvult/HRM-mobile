import { describe, expect, it } from "vitest";
import type { ImagePickerAsset } from "expo-image-picker";
import {
  getLeaveAttachment,
  getLeaveDatePreview,
  MAX_LEAVE_ATTACHMENT_BYTES,
} from "@/screens/leaves/leave-form-helpers";

describe("UC013 ngày nghỉ dự kiến", () => {
  it.each([
    ["2026-11-23", "2026-11-23", 1],
    ["2026-11-23", "2026-11-27", 5],
    ["2026-11-27", "2026-11-30", 2],
    ["2026-12-31", "2027-01-04", 3],
    ["2028-02-28", "2028-03-01", 3],
  ])(
    "%s đến %s tính %i ngày gồm hai đầu, không trừ ngày lễ",
    (start, end, days) => {
      expect(getLeaveDatePreview(start, end, "2026-01-01")).toEqual({
        days,
        startError: null,
        endError: null,
      });
    },
  );
  it.each([
    ["2026-11-28", "2026-11-29"],
    ["2026-11-30", "2026-11-27"],
    ["2026-11-22", "2026-11-27"],
    ["2026-02-31", "2026-11-27"],
    ["2026-11-23", "2026-13-01"],
    ["2026-1-1", "2026-11-27"],
    ["", ""],
  ])("chặn khoảng ngày sai/quá khứ/cuối tuần %s — %s", (start, end) => {
    const result = getLeaveDatePreview(start, end, "2026-11-23");
    expect(result.days).toBe(0);
    expect(result.startError || result.endError).toBeTruthy();
  });
});

describe("UC013 một ảnh JPG/PNG/WebP tối đa 5 MB", () => {
  const asset: ImagePickerAsset = {
    uri: "file:///photo.jpg",
    width: 100,
    height: 100,
    mimeType: "image/jpeg",
    fileSize: 1024,
  };
  it.each(["image/jpeg", "image/png", "image/webp"])(
    "nhận %s đúng giới hạn",
    (mimeType) => {
      expect(
        getLeaveAttachment({
          ...asset,
          mimeType,
          fileSize: MAX_LEAVE_ATTACHMENT_BYTES,
        }),
      ).toMatchObject({
        contentType: mimeType,
        sizeBytes: MAX_LEAVE_ATTACHMENT_BYTES,
      });
    },
  );
  it("dùng File do Web trả về và giữ file để gửi multipart", () => {
    const file = new File(["image"], "photo.webp", { type: "image/webp" });
    expect(
      getLeaveAttachment({
        ...asset,
        mimeType: undefined,
        file,
        fileName: file.name,
        fileSize: undefined,
      }),
    ).toMatchObject({ file, sizeBytes: file.size, contentType: file.type });
  });
  it("MIME chưa xác định có thể dùng phần mở rộng, backend vẫn xác minh nội dung thực", () => {
    expect(
      getLeaveAttachment({ ...asset, mimeType: undefined, fileName: "anh.PNG" })
        .contentType,
    ).toBe("image/png");
  });
  it.each([
    { fileSize: MAX_LEAVE_ATTACHMENT_BYTES + 1 },
    { fileSize: undefined },
    { fileSize: 0 },
    { fileSize: -1 },
    { mimeType: "image/heic" },
    { mimeType: "image/gif" },
    { mimeType: "application/pdf", fileName: "fake.jpg" },
  ])(
    "từ chối ảnh quá lớn/không rõ kích thước/MIME ngoài hợp đồng %o",
    (change) => {
      expect(() => getLeaveAttachment({ ...asset, ...change })).toThrow();
    },
  );
});

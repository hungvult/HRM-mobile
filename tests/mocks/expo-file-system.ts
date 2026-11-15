// Vitest không có bộ nhớ Android; mô phỏng việc đọc file, còn multipart dùng bộ chuyển đổi Expo thật.
export class File {
  constructor(public uri: string) {}
  get exists() {
    return true;
  }
  get size() {
    return 8;
  }
  async bytes() {
    return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  }
}

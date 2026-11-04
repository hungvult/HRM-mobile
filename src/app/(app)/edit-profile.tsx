import React from "react";
import { Redirect } from "expo-router";

export default function EditProfileRoute() {
  // Giữ liên kết cũ an toàn: Mobile chỉ xem hồ sơ nên không mở biểu mẫu cập nhật khi truy cập trực tiếp.
  return <Redirect href="/(app)/(tabs)/profile" />;
}

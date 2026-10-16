import React from "react";
import { Stack } from "expo-router";
import { colors } from "../../constants";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bgSurface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: "Chỉnh sửa thông tin",
          headerBackTitle: "Quay lại",
        }}
      />
      <Stack.Screen
        name="create-leave"
        options={{
          title: "Tạo đơn nghỉ phép",
          headerBackTitle: "Quay lại",
        }}
      />
      <Stack.Screen
        name="leave-detail"
        options={{
          title: "Chi tiết đơn nghỉ phép",
          headerBackTitle: "Quay lại",
        }}
      />
    </Stack>
  );
}

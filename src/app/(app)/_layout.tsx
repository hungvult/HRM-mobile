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
        name="index"
        options={{
          title: "Cá nhân",
        }}
      />
    </Stack>
  );
}

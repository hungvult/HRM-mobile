import React from "react";
import { Tabs } from "expo-router";
import { colors } from "../../../constants";
import { CustomTabBar } from "../../../components/navigation";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        animation: "fade",
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
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="timesheet"
        options={{
          title: "Bảng công",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="leaves"
        options={{
          title: "Đơn từ",
        }}
      />
      <Tabs.Screen
        name="payroll"
        options={{
          title: "Lương",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
        }}
      />
    </Tabs>
  );
}

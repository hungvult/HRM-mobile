import React from "react";

// Chỉ mô phỏng cầu nối native sang DOM cho test nội dung, accessibility và sự kiện; không mô phỏng nghiệp vụ.
function Box({ children, accessibilityLabel, accessibilityRole }: any) {
  return (
    <div aria-label={accessibilityLabel} role={accessibilityRole}>
      {children}
    </div>
  );
}
function Button({
  children,
  onPress,
  disabled,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
}: any) {
  return (
    <button
      onClick={onPress}
      disabled={disabled}
      aria-label={accessibilityLabel}
      role={accessibilityRole}
      aria-pressed={accessibilityState?.selected}
    >
      {children}
    </button>
  );
}
export const nativeUI = {
  View: Box,
  Text: ({ children, accessibilityLabel, accessibilityRole }: any) => (
    <span aria-label={accessibilityLabel} role={accessibilityRole}>
      {children}
    </span>
  ),
  ScrollView: Box,
  SafeAreaView: Box,
  TouchableOpacity: Button,
  Pressable: Button,
  ActivityIndicator: () => <span role="status">Đang tải</span>,
  RefreshControl: () => null,
  Modal: ({ visible, children }: any) =>
    visible ? <div role="dialog">{children}</div> : null,
  FlatList: ({
    data,
    renderItem,
    ListEmptyComponent,
    ListFooterComponent,
  }: any) => (
    <div>
      {data.map((item: any) => (
        <React.Fragment key={item.id}>{renderItem({ item })}</React.Fragment>
      ))}
      {!data.length && ListEmptyComponent?.()}
      {ListFooterComponent?.()}
    </div>
  ),
  Platform: { OS: "ios", select: (value: any) => value.ios ?? value.default },
  StyleSheet: { create: (value: any) => value },
};

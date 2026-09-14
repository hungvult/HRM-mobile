import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card } from "../../components";
import { colors, radius, spacing, typography } from "../../constants";
import { useAuth } from "../../hooks";

export function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const employee = user?.employee;

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: performLogout,
        },
      ],
    );
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "WORKING":
        return "Đang làm việc";
      case "PROBATION":
        return "Thử việc";
      case "RESIGNED":
        return "Đã nghỉ việc";
      case "TERMINATED":
        return "Đã bị chấm dứt";
      default:
        return status || "Hoạt động";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {employee?.fullName
                ? employee.fullName.split(" ").pop()?.charAt(0).toUpperCase()
                : user?.username?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <Text style={styles.fullName}>
            {employee?.fullName || user?.username || "Nhân viên"}
          </Text>
          <Text style={styles.employeeCode}>
            Mã NV: {employee?.employeeCode || "Chưa cập nhật"}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {getStatusLabel(employee?.employmentStatus)}
            </Text>
          </View>
        </Card>

        {/* Detailed Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Thông tin công việc</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phòng ban</Text>
            <Text style={styles.infoValue}>
              {employee?.department?.name || "Chưa phân bổ"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chức vụ</Text>
            <Text style={styles.infoValue}>
              {employee?.position?.name || "Chưa phân bổ"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>
              {employee?.email || user?.email || "Chưa cập nhật"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tài khoản</Text>
            <Text style={styles.infoValue}>{user?.username}</Text>
          </View>
        </Card>

        {/* Logout Section */}
        <View style={styles.actionSection}>
          <Button
            title="Đăng xuất"
            variant="danger"
            onPress={handleLogoutPress}
            loading={isLoggingOut || isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  userCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primarySubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  fullName: {
    fontSize: typography.xl.fontSize,
    lineHeight: typography.xl.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  employeeCode: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.successSubtle,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.xs.fontSize,
    color: colors.success,
    fontWeight: typography.weights.medium,
  },
  infoCard: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    textAlign: "right",
    flexShrink: 1,
    marginLeft: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  actionSection: {
    marginTop: spacing.md,
  },
});

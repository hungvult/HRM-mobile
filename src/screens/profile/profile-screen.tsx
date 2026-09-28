import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, InfoField } from "../../components";
import { colors, radius, spacing, typography } from "../../constants";
import { useAuth, useUser } from "../../hooks";

export function ProfileScreen() {
  const { logout, isLoading: isAuthLoading } = useAuth();
  const { user, employee, isLoading, isRefreshing, error, refreshUser } =
    useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      ]
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatGender = (gender?: string) => {
    switch (gender) {
      case "MALE":
        return "Nam";
      case "FEMALE":
        return "Nữ";
      case "OTHER":
        return "Khác";
      default:
        return gender || "";
    }
  };

  const formatRoles = (roles?: string[]) => {
    if (!roles || roles.length === 0) return "";
    return roles
      .map((role) => {
        switch (role) {
          case "ADMIN":
            return "Quản trị viên";
          case "HR":
            return "Nhân sự (HR)";
          case "EMPLOYEE":
            return "Nhân viên";
          case "MANAGER":
            return "Quản lý";
          default:
            return role;
        }
      })
      .join(", ");
  };

  if (isLoading && !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateMessage}>Đang tải hồ sơ nhân viên...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>Không thể tải hồ sơ</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Button
              title="Thử lại"
              onPress={() => refreshUser()}
              style={styles.retryButton}
            />
            <Button
              title="Đăng xuất"
              variant="outline"
              onPress={handleLogoutPress}
              loading={isLoggingOut || isAuthLoading}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshUser}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {error ? (
          <Card style={styles.bannerError}>
            <Text style={styles.bannerErrorText}>{error}</Text>
          </Card>
        ) : null}

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

        {/* Card 1: Thông tin tài khoản */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <InfoField label="Tên đăng nhập" value={user?.username} />
          <InfoField label="Email hệ thống" value={user?.email} />
          <InfoField label="Vai trò" value={formatRoles(user?.roles)} isLast />
        </Card>

        {/* Card 2: Thông tin công việc */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Thông tin công việc</Text>
          <InfoField
            label="Phòng ban"
            value={
              employee?.department
                ? `${employee.department.name} (${employee.department.code})`
                : "Chưa phân bổ"
            }
          />
          <InfoField
            label="Chức vụ"
            value={
              employee?.position
                ? `${employee.position.name} (${employee.position.code})`
                : "Chưa phân bổ"
            }
          />
          <InfoField
            label="Quản lý trực tiếp"
            value={
              employee?.manager
                ? `${employee.manager.fullName} (${employee.manager.employeeCode})`
                : "Chưa phân bổ"
            }
          />
          <InfoField
            label="Ngày vào làm"
            value={formatDate(employee?.hireDate)}
            isLast
          />
        </Card>

        {/* Card 3: Thông tin cá nhân */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <InfoField label="Họ và tên" value={employee?.fullName} />
          <InfoField
            label="Ngày sinh"
            value={formatDate(employee?.dateOfBirth)}
          />
          <InfoField label="Giới tính" value={formatGender(employee?.gender)} />
          <InfoField label="Số điện thoại" value={employee?.phone} />
          <InfoField
            label="Email liên hệ"
            value={employee?.email || user?.email}
          />
          <InfoField
            label="Địa chỉ thường trú"
            value={employee?.address}
            isLast
          />
        </Card>

        {/* Logout Section */}
        <View style={styles.actionSection}>
          <Button
            title="Đăng xuất"
            variant="danger"
            onPress={handleLogoutPress}
            loading={isLoggingOut || isAuthLoading}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  stateMessage: {
    marginTop: spacing.md,
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
  },
  errorCard: {
    width: "100%",
    padding: spacing.xl,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: typography.lg.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  retryButton: {
    width: "100%",
    marginBottom: spacing.sm,
  },
  bannerError: {
    backgroundColor: colors.dangerSubtle,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  bannerErrorText: {
    color: colors.danger,
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.medium,
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
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  actionSection: {
    marginTop: spacing.md,
  },
});

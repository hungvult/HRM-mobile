import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button, Card, InfoField } from "../../components";
import { colors, radius, spacing, typography } from "../../constants";
import { useAuth, useUser } from "../../hooks";
import {
  getStatusConfig,
  getAvatarLetter,
  formatDate,
  formatGender,
  formatRoles,
} from "../../utils";

function CopyIcon({ color }: { color: string }) {
  return (
    <View style={styles.copyIconWrapper}>
      <View style={[styles.copyIconBack, { borderColor: color }]} />
      <View style={[styles.copyIconFront, { borderColor: color }]} />
    </View>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const { logout, isLoading: isAuthLoading } = useAuth();
  const { user, employee, isLoading, isRefreshing, error, refreshUser } =
    useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      if (isMountedRef.current) {
        setIsLoggingOut(false);
      }
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

  const handleCopy = async (
    label: string,
    text?: string | null,
    key?: string,
  ) => {
    if (!text) return;
    try {
      await Clipboard.setStringAsync(text);
      if (!isMountedRef.current) return;
      if (key) {
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        setCopiedKey(key);
        copyTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setCopiedKey((prev) => (prev === key ? null : prev));
          }
          copyTimeoutRef.current = null;
        }, 2000);
      }
    } catch {
      if (isMountedRef.current) {
        Alert.alert("Lỗi", "Không thể sao chép vào bộ nhớ tạm.");
      }
    }
  };

  const renderCopyAction = (
    label: string,
    text?: string | null,
    key?: string,
  ) => {
    if (!text || text === "—") return null;
    const isCopied = key && copiedKey === key;
    return (
      <TouchableOpacity
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => handleCopy(label, text, key)}
        style={[styles.copyButton, isCopied && styles.copyButtonSuccess]}
        accessibilityRole="button"
        accessibilityLabel={`Sao chép ${label}`}
      >
        {isCopied ? (
          <Text style={styles.copyCheckmark}>✓</Text>
        ) : (
          <CopyIcon color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && !user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateMessage}>Đang tải hồ sơ nhân viên...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
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

  const statusConfig = employee
    ? getStatusConfig(employee.employmentStatus)
    : {
        label: "Chưa liên kết hồ sơ",
        bg: colors.warningSubtle,
        text: colors.warning,
      };

  const avatarLetter = getAvatarLetter(employee?.fullName, user?.username);

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
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
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.fullName}>
            {employee?.fullName || user?.username || "Nhân viên"}
          </Text>
          <View style={styles.employeeCodeRow}>
            <Text style={styles.employeeCode}>
              Mã NV: {employee?.employeeCode || "Chưa cập nhật"}
            </Text>
            {employee?.employeeCode
              ? renderCopyAction("Mã NV", employee.employeeCode, "employeeCode")
              : null}
          </View>
          <View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.badgeText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>
        </Card>

        {/* Card 1: Thông tin tài khoản */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <InfoField
            label="Tên đăng nhập"
            value={user?.username}
            rightAction={renderCopyAction(
              "Tên đăng nhập",
              user?.username,
              "username",
            )}
          />
          <InfoField
            label="Email hệ thống"
            value={user?.email}
            rightAction={renderCopyAction(
              "Email hệ thống",
              user?.email,
              "userEmail",
            )}
          />
          <InfoField label="Vai trò" value={formatRoles(user?.roles)} isLast />
        </Card>

        {/* Xử lý khi tài khoản chưa liên kết hồ sơ nhân viên */}
        {!employee ? (
          <Card style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>
              Tài khoản chưa liên kết nhân viên
            </Text>
            <Text style={styles.noticeText}>
              Tài khoản này hiện chưa được liên kết với hồ sơ nhân viên trong hệ
              thống. Vui lòng liên hệ quản trị viên (Admin) hoặc bộ phận nhân sự
              (HR) để được phân công.
            </Text>
          </Card>
        ) : (
          <>
            {/* Card 2: Thông tin công việc */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Thông tin công việc</Text>
              <InfoField
                label="Phòng ban"
                value={
                  employee.department
                    ? `${employee.department.name} (${employee.department.code})`
                    : "Chưa phân bổ"
                }
              />
              <InfoField
                label="Chức vụ"
                value={
                  employee.position
                    ? `${employee.position.name} (${employee.position.code})`
                    : "Chưa phân bổ"
                }
              />
              <InfoField
                label="Quản lý trực tiếp"
                value={
                  employee.manager
                    ? `${employee.manager.fullName} (${employee.manager.employeeCode})`
                    : "Chưa phân bổ"
                }
                rightAction={
                  employee.manager?.employeeCode
                    ? renderCopyAction(
                        "Mã QL",
                        employee.manager.employeeCode,
                        "managerCode",
                      )
                    : undefined
                }
              />
              <InfoField
                label="Ngày vào làm"
                value={formatDate(employee.hireDate)}
                isLast
              />
            </Card>

            {/* Card 3: Thông tin cá nhân */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>Thông tin cá nhân</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => router.push("/edit-profile")}
                  accessibilityRole="button"
                  accessibilityLabel="Chỉnh sửa thông tin cá nhân"
                >
                  <Text style={styles.editButtonText}>Chỉnh sửa</Text>
                </TouchableOpacity>
              </View>
              <InfoField label="Họ và tên" value={employee.fullName} />
              <InfoField
                label="Ngày sinh"
                value={formatDate(employee.dateOfBirth)}
              />
              <InfoField
                label="Giới tính"
                value={formatGender(employee.gender)}
              />
              <InfoField
                label="Số điện thoại"
                value={employee.phone}
                rightAction={renderCopyAction(
                  "Số điện thoại",
                  employee.phone,
                  "phone",
                )}
              />
              <InfoField
                label="Email liên hệ"
                value={employee.email || user?.email}
                rightAction={renderCopyAction(
                  "Email liên hệ",
                  employee.email || user?.email,
                  "contactEmail",
                )}
              />
              <InfoField
                label="Địa chỉ thường trú"
                value={employee.address}
                isLast
              />
            </Card>
          </>
        )}

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
  employeeCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  employeeCode: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.medium,
  },
  copyButton: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  copyButtonSuccess: {
    backgroundColor: colors.successSubtle,
  },
  copyIconWrapper: {
    width: 14,
    height: 14,
    position: "relative",
  },
  copyIconBack: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 9,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.3,
  },
  copyIconFront: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 9,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.3,
    backgroundColor: colors.bgSurface,
  },
  copyCheckmark: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  noticeCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.warningSubtle,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  noticeTitle: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  noticeText: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    color: colors.textPrimary,
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  editButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.md,
    backgroundColor: colors.primarySubtle,
  },
  editButtonText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  actionSection: {
    marginTop: spacing.md,
  },
});

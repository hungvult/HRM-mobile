import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Keyboard,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { Button, Card, Input, InfoField } from "../../components";
import { colors, radius, spacing, typography } from "../../constants";
import { useUser } from "../../hooks";
import { userService, ApiError } from "../../services";

export function sanitizePhone(phone?: string | null): string {
  if (!phone) return "";
  return phone.replace(/[\s\-\u00AD\u2010-\u2015\u2212\uFE63\uFF0D]/g, "");
}

function validatePhone(phone: string): string | null {
  const sanitized = sanitizePhone(phone);
  if (!sanitized) {
    return "Số điện thoại không được để trống.";
  }
  const phoneRegex = /^\+?[0-9]{9,15}$/;
  if (!phoneRegex.test(sanitized)) {
    return "Số điện thoại phải gồm 9 đến 15 chữ số (có thể bắt đầu bằng dấu +).";
  }
  return null;
}

function validateAddress(address: string): string | null {
  const trimmed = address.trim();
  if (!trimmed) {
    return "Địa chỉ thường trú không được để trống.";
  }
  if (trimmed.length > 1000) {
    return "Địa chỉ không được vượt quá 1000 ký tự.";
  }
  return null;
}

function getFriendlyUpdateError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "INVALID_REQUEST_BODY") {
      return "Yêu cầu không hợp lệ hoặc chứa trường không được hỗ trợ.";
    }

    if (err.code === "VALIDATION_ERROR" || err.status === 400) {
      if (err.errors && err.errors.length > 0) {
        return err.errors.map((e) => e.message).join("\n");
      }
      return "Dữ liệu cập nhật không hợp lệ. Vui lòng kiểm tra lại.";
    }

    if (err.code === "PROFILE_NOT_FOUND" || err.status === 404) {
      return "Không tìm thấy hồ sơ nhân viên để cập nhật.";
    }

    if (err.code === "NETWORK_ERROR" || err.status === 0) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.";
    }

    if (err.code === "TIMEOUT_ERROR" || err.status === 408) {
      return "Quá thời gian kết nối đến máy chủ. Vui lòng thử lại sau.";
    }

    if (err.status >= 500) {
      return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
    }

    // Suppress raw non-localized ASCII errors (e.g. backend English messages)
    // in favor of friendly Vietnamese feedback, while passing through localized Vietnamese messages.
    if (err.message && !/^[A-Za-z0-9\s.,!?:;'"()\-_]+$/.test(err.message)) {
      return err.message;
    }
  }

  return "Không thể cập nhật thông tin. Vui lòng thử lại sau.";
}

export function EditProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const addressInputRef = useRef<TextInput>(null);
  const scrollOffsetRef = useRef(0);
  const keyboardTopRef = useRef<number | null>(null);
  const addressFocusedRef = useRef(false);
  const focusScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const scrollAddressAboveKeyboard = () => {
    const keyboardTop = keyboardTopRef.current;
    if (keyboardTop === null) return;

    addressInputRef.current?.measureInWindow((_x, y, _width, height) => {
      const overlap = y + height + spacing.xl - keyboardTop;
      if (overlap > 0) {
        scrollViewRef.current?.scrollTo({
          y: scrollOffsetRef.current + overlap,
          animated: true,
        });
      }
    });
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        keyboardTopRef.current = event.endCoordinates.screenY;
        if (addressFocusedRef.current) {
          if (focusScrollTimerRef.current) {
            clearTimeout(focusScrollTimerRef.current);
          }
          focusScrollTimerRef.current = setTimeout(
            scrollAddressAboveKeyboard,
            50,
          );
        }
      },
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTopRef.current = null;
      addressFocusedRef.current = false;
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (focusScrollTimerRef.current) {
        clearTimeout(focusScrollTimerRef.current);
      }
    };
  }, []);
  const { user, employee, updateUser } = useUser();

  const initialPhone = employee?.phone ?? "";
  const initialAddress = employee?.address ?? "";

  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSavedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isDirty =
    phone.trim() !== initialPhone.trim() ||
    address.trim() !== initialAddress.trim();

  useEffect(() => {
    if (!isDirty) {
      setPhone(employee?.phone ?? "");
      setAddress(employee?.address ?? "");
    }
  }, [employee?.phone, employee?.address, isDirty]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!isDirty || isSavedRef.current) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        "Hủy thay đổi?",
        "Bạn có những thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?",
        [
          { text: "Ở lại", style: "cancel" },
          {
            text: "Rời đi",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation, isDirty]);

  const handleCancel = () => {
    router.back();
  };

  const handleSubmit = async () => {
    const sanitizedPhone = sanitizePhone(phone);
    const pError = validatePhone(sanitizedPhone);
    const aError = validateAddress(address);

    setPhoneError(pError);
    setAddressError(aError);
    setGeneralError(null);

    if (pError || aError) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedProfile = await userService.updateProfile({
        phone: sanitizedPhone,
        address: address.trim(),
      });

      if (isMountedRef.current) {
        setPhone(sanitizedPhone);
        setAddress(address.trim());
      }
      isSavedRef.current = true;
      updateUser(updatedProfile);

      if (isMountedRef.current) {
        Alert.alert(
          "Thành công",
          "Thông tin cá nhân của bạn đã được cập nhật thành công.",
          [
            {
              text: "Xác nhận",
              onPress: () => router.back(),
            },
          ],
        );
      }
    } catch (err) {
      if (isMountedRef.current) {
        setGeneralError(getFriendlyUpdateError(err));
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {/* Header Note */}
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Thông tin liên hệ</Text>
            <Text style={styles.introSubtitle}>
              Bạn có thể tự cập nhật số điện thoại và địa chỉ thường trú. Các
              thông tin khác do bộ phận Nhân sự (HR) quản trị.
            </Text>
          </View>

          {/* General Error Banner */}
          {generalError ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Form Card */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Thông tin chỉnh sửa</Text>

            <Input
              label="Số điện thoại *"
              placeholder="Ví dụ: 0987654321 hoặc +84987654321"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                isSavedRef.current = false;
                if (phoneError) setPhoneError(null);
                if (generalError) setGeneralError(null);
              }}
              error={phoneError || undefined}
              keyboardType="phone-pad"
              returnKeyType="next"
              editable={!isSubmitting}
            />

            <Input
              inputRef={addressInputRef}
              label="Địa chỉ thường trú *"
              placeholder="Nhập địa chỉ nơi ở hiện tại..."
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                isSavedRef.current = false;
                if (addressError) setAddressError(null);
                if (generalError) setGeneralError(null);
              }}
              error={addressError || undefined}
              multiline
              numberOfLines={3}
              maxLength={1000}
              style={styles.addressInput}
              returnKeyType="done"
              onFocus={() => {
                addressFocusedRef.current = true;
                if (focusScrollTimerRef.current) {
                  clearTimeout(focusScrollTimerRef.current);
                }
                focusScrollTimerRef.current = setTimeout(
                  scrollAddressAboveKeyboard,
                  350,
                );
              }}
              onBlur={() => {
                addressFocusedRef.current = false;
              }}
              editable={!isSubmitting}
            />
          </Card>

          {/* Read-only Reference Card */}
          <Card style={styles.readOnlyCard}>
            <View style={styles.readOnlyHeader}>
              <Text style={styles.readOnlyTitle}>Thông tin đối chiếu</Text>
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeText}>HR quản lý</Text>
              </View>
            </View>
            <InfoField
              label="Họ và tên"
              value={employee?.fullName || user?.username}
            />
            <InfoField
              label="Mã nhân viên"
              value={employee?.employeeCode || "Chưa cập nhật"}
            />
            <InfoField
              label="Email hệ thống"
              value={user?.email || "Chưa cập nhật"}
            />
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
              isLast
            />
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <Button
              title="Lưu thay đổi"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!isDirty || isSubmitting}
              style={styles.submitButton}
            />
            <Button
              title="Hủy bỏ"
              variant="outline"
              onPress={handleCancel}
              disabled={isSubmitting}
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  introCard: {
    marginBottom: spacing.md,
  },
  introTitle: {
    fontSize: typography.lg.fontSize,
    lineHeight: typography.lg.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  introSubtitle: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    color: colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: colors.dangerSubtle,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    color: colors.danger,
    fontWeight: typography.weights.medium,
  },
  formCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.base.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  addressInput: {
    minHeight: 76,
    textAlignVertical: "top",
    paddingTop: spacing.xs,
  },
  readOnlyCard: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.bgApp,
    borderColor: colors.border,
    borderWidth: 1,
  },
  readOnlyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  readOnlyTitle: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  lockBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  lockBadgeText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  buttonGroup: {
    gap: spacing.sm,
  },
  submitButton: {
    width: "100%",
  },
  cancelButton: {
    width: "100%",
  },
});

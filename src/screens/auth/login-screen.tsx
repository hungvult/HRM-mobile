import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Card } from "../../components";
import { colors, radius, spacing, typography } from "../../constants";
import { useAuth } from "../../hooks";
import { ApiError } from "../../services";

function getFriendlyLoginError(err: ApiError): string {
  if (err.code === "AUTH_INVALID_CREDENTIALS" || err.status === 401) {
    return "Tên đăng nhập/email hoặc mật khẩu không đúng.";
  }

  if (err.code === "AUTH_ACCOUNT_LOCKED") {
    return "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.";
  }

  if (err.code === "AUTH_ACCOUNT_DISABLED") {
    return "Tài khoản đã bị vô hiệu hóa.";
  }

  if (err.code === "AUTH_UNAUTHORIZED") {
    return "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.";
  }

  if (err.code === "AUTH_FORBIDDEN" || err.status === 403) {
    return "Bạn không có quyền truy cập tài nguyên này.";
  }

  if (err.code === "VALIDATION_ERROR" || err.status === 400) {
    if (err.errors && err.errors.length > 0) {
      const passwordErr = err.errors.find((e) => e.field === "password");
      if (passwordErr) {
        return "Mật khẩu phải có từ 8 đến 128 ký tự.";
      }
      const identityErr = err.errors.find(
        (e) => e.field === "usernameOrEmail" || e.field === "username",
      );
      if (identityErr) {
        return "Tên đăng nhập hoặc email phải có từ 3 đến 255 ký tự.";
      }
      return "Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại.";
    }
    return "Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại.";
  }

  if (err.code === "TIMEOUT_ERROR" || err.status === 408) {
    return "Quá thời gian kết nối đến máy chủ. Vui lòng thử lại sau.";
  }

  if (err.code === "NETWORK_ERROR" || err.status === 0) {
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
  }

  if (err.status >= 500) {
    return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
  }

  const errorRef = err.code || (err.status ? `HTTP_${err.status}` : null);
  return errorRef
    ? `Không thể đăng nhập. Vui lòng thử lại sau. (Mã: ${errorRef})`
    : "Không thể đăng nhập. Vui lòng thử lại sau.";
}

export function LoginScreen() {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    const trimmedInput = usernameOrEmail.trim();
    if (!trimmedInput) {
      setErrorMessage("Vui lòng nhập tên đăng nhập hoặc email.");
      return;
    }
    if (trimmedInput.length < 3) {
      setErrorMessage("Tên đăng nhập hoặc email phải có ít nhất 3 ký tự.");
      return;
    }
    if (trimmedInput.length > 255) {
      setErrorMessage(
        "Tên đăng nhập hoặc email không được vượt quá 255 ký tự.",
      );
      return;
    }
    if (!password) {
      setErrorMessage("Vui lòng nhập mật khẩu.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (password.length > 128) {
      setErrorMessage("Mật khẩu không được vượt quá 128 ký tự.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const deviceInfo = `${Platform.OS} ${Platform.Version}`;

    try {
      await login({
        usernameOrEmail: trimmedInput,
        password,
        deviceInfo,
      });
    } catch (err) {
      if (__DEV__) {
        console.warn("[LoginScreen Error]:", err);
      }
      if (err instanceof ApiError) {
        setErrorMessage(getFriendlyLoginError(err));
      } else {
        setErrorMessage("Không thể đăng nhập. Vui lòng thử lại sau.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header & Branding */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>HRM</Text>
            </View>
            <Text style={styles.title}>Đăng nhập</Text>
            <Text style={styles.subtitle}>
              Hệ thống Quản trị Nhân sự nội bộ
            </Text>
          </View>

          {/* Form Card */}
          <Card style={styles.card}>
            {errorMessage ? (
              <View
                style={styles.errorBanner}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Input
              label="Tên đăng nhập hoặc Email"
              placeholder="Ví dụ: an.nguyen hoặc an.nguyen@company.vn"
              value={usernameOrEmail}
              onChangeText={(text) => {
                setUsernameOrEmail(text);
                if (errorMessage) setErrorMessage(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />

            <Input
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage(null);
              }}
              isPassword
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <Button
              title="Đăng nhập"
              onPress={handleLogin}
              loading={isSubmitting}
              style={styles.loginButton}
            />
          </Card>

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Dành riêng cho nhân viên công ty
            </Text>
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
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing["2xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  title: {
    fontSize: typography["2xl"].fontSize,
    lineHeight: typography["2xl"].lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    color: colors.textSecondary,
    textAlign: "center",
  },
  card: {
    padding: spacing.xl,
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
  loginButton: {
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: spacing["2xl"],
    alignItems: "center",
  },
  footerText: {
    fontSize: typography.xs.fontSize,
    color: colors.textDisabled,
  },
});

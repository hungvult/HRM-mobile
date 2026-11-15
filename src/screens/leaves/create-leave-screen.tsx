import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  Keyboard,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
  AppState,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Input, DatePickerModal } from "../../components";
import { colors, radius, spacing, typography } from "../../constants";
import { authStorage, leaveService } from "../../services";
import {
  LeaveAttachmentUpload,
  LeaveBalanceItem,
  LeaveType,
} from "../../types";
import { getLeaveAttachment, getLeaveDatePreview } from "./leave-form-helpers";
import { formatDate, getFriendlyErrorMessage } from "../../utils";

// Ngày hiển thị theo lịch cục bộ của thiết bị, không đổi sang UTC làm lệch ngày chọn.
function formatDateToIso(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Form UC013 đọc danh mục/quỹ phép của nhân viên đang đăng nhập, cho chọn ngày và một ảnh tùy chọn.
 * Tổng ngày chỉ là dự kiến Thứ Hai–Thứ Sáu; backend tính lại và kiểm tra quỹ với loại hưởng lương.
 * Gửi một POST rồi giữ nguyên form nếu lỗi; ảnh chỉ được lưu cùng đơn khi backend thành công.
 */
export function CreateLeaveScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const [todayIso, setTodayIso] = useState(() => formatDateToIso(new Date()));
  // Mốc khởi tạo chỉ dùng nhận biết người dùng sửa form; lịch sang ngày mới không phải thao tác chỉnh sửa.
  const initialDateRef = useRef(todayIso);

  // Form có thể mở qua nửa đêm hoặc nằm nền nhiều ngày; cập nhật ngày để preview/lịch chặn ngày đã qua.
  useEffect(() => {
    const updateToday = () => setTodayIso(formatDateToIso(new Date()));
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setHours(24, 0, 0, 50);
    const timer = setTimeout(updateToday, nextDay.getTime() - now.getTime());
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") updateToday();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [todayIso]);

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState<boolean>(true);
  const [typesError, setTypesError] = useState<string | null>(null);

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>(todayIso);
  const [endDate, setEndDate] = useState<string>(todayIso);
  const [reason, setReason] = useState<string>("");
  const [attachment, setAttachment] = useState<LeaveAttachmentUpload | null>(
    null,
  );
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);

  const [startDateError, setStartDateError] = useState<string | null>(null);
  const [endDateError, setEndDateError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [activePicker, setActivePicker] = useState<"START" | "END" | null>(
    null,
  );

  const isSavedRef = useRef<boolean>(false);
  const screenSessionRef = useRef(authStorage.getSessionVersion());
  const submittingRef = useRef(false);
  const pickingImageRef = useRef(false);
  const isMountedRef = useRef<boolean>(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const startDateInputRef = useRef<TextInput>(null);
  const endDateInputRef = useRef<TextInput>(null);
  const reasonInputRef = useRef<TextInput>(null);
  const scrollOffsetRef = useRef(0);
  const keyboardTopRef = useRef<number | null>(null);
  const activeInputRef = useRef<React.RefObject<TextInput | null> | null>(null);
  const focusScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const scrollInputAboveKeyboard = (
    targetRef: React.RefObject<TextInput | null> | null,
  ) => {
    const keyboardTop = keyboardTopRef.current;
    if (keyboardTop === null || !targetRef?.current) return;

    targetRef.current.measureInWindow((_x, y, _width, height) => {
      if (typeof y !== "number" || typeof height !== "number") return;
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
        const height = event.endCoordinates.height;
        setKeyboardHeight(height);
        keyboardTopRef.current = event.endCoordinates.screenY;
        if (activeInputRef.current) {
          if (focusScrollTimerRef.current) {
            clearTimeout(focusScrollTimerRef.current);
          }
          const currentRef = activeInputRef.current;
          focusScrollTimerRef.current = setTimeout(
            () => scrollInputAboveKeyboard(currentRef),
            50,
          );
        }
      },
    );
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
      keyboardTopRef.current = null;
      activeInputRef.current = null;
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (focusScrollTimerRef.current) {
        clearTimeout(focusScrollTimerRef.current);
      }
    };
  }, []);

  const handleInputFocus = (targetRef: React.RefObject<TextInput | null>) => {
    activeInputRef.current = targetRef;
    if (focusScrollTimerRef.current) {
      clearTimeout(focusScrollTimerRef.current);
    }
    focusScrollTimerRef.current = setTimeout(
      () => scrollInputAboveKeyboard(targetRef),
      350,
    );
  };

  const handleInputBlur = () => {
    activeInputRef.current = null;
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch leave types and balances on mount
  const loadMeta = useCallback(async () => {
    setIsLoadingTypes(true);
    setTypesError(null);
    try {
      const curYear = new Date().getFullYear();
      const [typesRes, balancesRes] = await Promise.allSettled([
        leaveService.getLeaveTypes(),
        leaveService.getLeaveBalances(curYear),
      ]);

      if (typesRes.status === "fulfilled" && typesRes.value.length > 0) {
        setLeaveTypes(typesRes.value);
        setSelectedTypeId((prev) =>
          prev && typesRes.value.some((t) => t.id === prev)
            ? prev
            : typesRes.value[0].id,
        );
      } else {
        setTypesError("Không thể tải danh mục loại phép từ máy chủ.");
      }

      if (
        balancesRes.status === "fulfilled" &&
        balancesRes.value.items &&
        balancesRes.value.items.length > 0
      ) {
        setBalances(balancesRes.value.items);
      }
    } catch {
      setTypesError("Không thể kết nối đến máy chủ.");
    } finally {
      if (isMountedRef.current) {
        setIsLoadingTypes(false);
      }
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const selectedBalance = useMemo(() => {
    if (!selectedTypeId) return null;
    return balances.find((b) => b.leaveTypeId === selectedTypeId) || null;
  }, [balances, selectedTypeId]);

  // Đổi khoảng ngày cập nhật ngay phần dự kiến; chỉ gửi ID loại phép, không gửi số ngày app tính.
  const datePreview = useMemo(
    () => getLeaveDatePreview(startDate, endDate, todayIso),
    [startDate, endDate, todayIso],
  );

  const isDirty = useMemo(() => {
    return (
      !!attachment ||
      reason.trim().length > 0 ||
      startDate !== initialDateRef.current ||
      endDate !== initialDateRef.current
    );
  }, [attachment, reason, startDate, endDate]);

  // Handle BeforeRemove listener for dirty form guard
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Logout luôn được rời form, không để cảnh báo dữ liệu chưa gửi giữ lại màn của phiên cũ.
      if (!authStorage.isCurrentSession(screenSessionRef.current)) return;
      // Chờ kết quả POST hiện tại trước khi rời màn để tránh gửi lại đơn từ một form khác.
      if (submittingRef.current) {
        e.preventDefault();
        return;
      }
      if (!isDirty || isSavedRef.current) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        "Hủy thay đổi?",
        "Bạn có những thay đổi chưa gửi. Bạn có chắc chắn muốn rời đi?",
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

  // Chặn ngày sai/quá khứ/ngược hoặc chỉ có cuối tuần ngay tại form; backend vẫn kiểm tra lại.
  const validateForm = (): boolean => {
    let isValid = true;
    setStartDateError(null);
    setEndDateError(null);
    setReasonError(null);
    setGeneralError(null);

    if (!selectedTypeId) {
      setGeneralError("Vui lòng chọn loại nghỉ phép.");
      return false;
    }

    const preview = getLeaveDatePreview(
      startDate,
      endDate,
      formatDateToIso(new Date()),
    );
    setStartDateError(preview.startError);
    setEndDateError(preview.endError);
    if (preview.startError || preview.endError) isValid = false;

    if (reason.trim().length < 10) {
      setReasonError("Lý do xin nghỉ phải có ít nhất 10 ký tự.");
      isValid = false;
    }

    return isValid;
  };

  /** Chọn một ảnh bằng thư viện hệ thống; hủy chọn/sai ảnh giữ ảnh cũ và chưa gọi API tạo đơn. */
  const handlePickImage = async () => {
    if (pickingImageRef.current || submittingRef.current) return;
    pickingImageRef.current = true;
    setIsPickingImage(true);
    setAttachmentError(null);
    const version = authStorage.getSessionVersion();
    try {
      // Chỉ chọn ảnh, không cắt/chuyển định dạng hoặc xin quyền camera/microphone.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 1,
      });
      if (!isMountedRef.current || !authStorage.isCurrentSession(version))
        return;
      if (!result.canceled && result.assets[0])
        setAttachment(getLeaveAttachment(result.assets[0]));
    } catch (err) {
      if (isMountedRef.current && authStorage.isCurrentSession(version))
        setAttachmentError(
          err instanceof Error
            ? err.message
            : "Không thể chọn ảnh. Vui lòng thử lại.",
        );
    } finally {
      pickingImageRef.current = false;
      if (isMountedRef.current) setIsPickingImage(false);
    }
  };

  /** Gửi dữ liệu form và ảnh tùy chọn một lần; khóa bằng ref ngay cả trước lượt render tiếp theo. */
  const handleSubmit = async () => {
    if (submittingRef.current || pickingImageRef.current || isSavedRef.current)
      return;
    if (!validateForm() || !selectedTypeId) return;

    submittingRef.current = true;
    const version = authStorage.getSessionVersion();
    setIsSubmitting(true);
    try {
      await leaveService.createLeaveRequest(
        {
          leaveTypeId: selectedTypeId,
          startDate,
          endDate,
          reason: reason.trim(),
        },
        attachment,
      );

      if (!isMountedRef.current || !authStorage.isCurrentSession(version))
        return;

      isSavedRef.current = true;
      Alert.alert(
        "Thành công",
        "Đơn nghỉ phép của bạn đã được gửi thành công và đang chờ duyệt.",
        [
          {
            text: "Xác nhận",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (err: any) {
      if (!isMountedRef.current || !authStorage.isCurrentSession(version))
        return;
      const friendlyMsg = getFriendlyErrorMessage(
        err,
        "Không thể gửi đơn nghỉ phép. Vui lòng thử lại sau.",
      );

      if (
        err?.code === "LEAVE_REQUEST_OVERLAP" ||
        err?.code === "LEAVE_REQUEST_REVIEWER_NOT_FOUND" ||
        err?.status === 409
      ) {
        Alert.alert("Không thể gửi đơn", friendlyMsg, [{ text: "Đã hiểu" }]);
      } else {
        // Mất phản hồi không chứng minh POST thất bại; người dùng cần kiểm tra đơn đã lưu trước khi tự gửi lại.
        const uncertainResult =
          err?.code === "NETWORK_ERROR" ||
          err?.code === "TIMEOUT_ERROR" ||
          err?.status === 0 ||
          err?.status === 408;
        setGeneralError(
          uncertainResult
            ? `${friendlyMsg} Vui lòng kiểm tra danh sách đơn trước khi gửi lại.`
            : friendlyMsg,
        );
      }
    } finally {
      submittingRef.current = false;
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
          contentContainerStyle={[
            styles.scrollContent,
            keyboardHeight > 0 && {
              paddingBottom: keyboardHeight + spacing.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {/* Header Intro Note */}
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Tạo đơn xin nghỉ</Text>
            <Text style={styles.introSubtitle}>
              Hệ thống tính ngày làm việc từ Thứ Hai đến Thứ Sáu. Phép không
              hưởng lương không trừ quỹ phép.
            </Text>
          </View>

          {/* General Error Banner */}
          {generalError ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons
                name="alert-circle"
                size={18}
                color={colors.danger}
                style={styles.errorIcon}
              />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Card 1: Leave Type Selection */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Loại nghỉ phép *</Text>
            {isLoadingTypes ? (
              <View style={styles.typesLoadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typesLoadingText}>
                  Đang tải danh mục loại phép...
                </Text>
              </View>
            ) : typesError && leaveTypes.length === 0 ? (
              <View style={styles.typesErrorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={colors.danger}
                />
                <Text style={styles.typesErrorText}>{typesError}</Text>
                <Pressable
                  onPress={loadMeta}
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                >
                  <Ionicons name="refresh" size={14} color={colors.primary} />
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.typeGrid}>
                {leaveTypes.map((type) => {
                  const isSelected = selectedTypeId === type.id;
                  const balanceItem = balances.find(
                    (b) => b.leaveTypeId === type.id,
                  );
                  let quotaText = "";
                  if (!type.paid) {
                    quotaText = "Không trừ quỹ phép";
                  } else if (balanceItem) {
                    quotaText = `Còn ${balanceItem.remainingDays} ngày`;
                  } else {
                    quotaText = `Hạn mức ${type.annualQuotaDays || 0} ngày`;
                  }

                  return (
                    <Pressable
                      key={type.id}
                      disabled={isSubmitting}
                      onPress={() => setSelectedTypeId(type.id)}
                      style={({ pressed }) => [
                        styles.typeChip,
                        isSelected && styles.typeChipSelected,
                        pressed && { opacity: 0.8 },
                      ]}
                      accessibilityRole="button"
                    >
                      <View style={styles.typeChipContent}>
                        <Text
                          style={[
                            styles.typeChipName,
                            isSelected && styles.typeChipNameSelected,
                          ]}
                        >
                          {type.name}
                        </Text>
                        <Text
                          style={[
                            styles.typeChipRemaining,
                            isSelected && styles.typeChipRemainingSelected,
                          ]}
                        >
                          {quotaText}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>

          {/* Card 2: Date Range */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Thời gian nghỉ *</Text>

            <Input
              inputRef={startDateInputRef}
              label="Từ ngày (YYYY-MM-DD)"
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={(text) => {
                setStartDate(text);
                if (startDateError) setStartDateError(null);
                if (generalError) setGeneralError(null);
              }}
              rightIcon={
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.primary}
                />
              }
              onRightIconPress={() => setActivePicker("START")}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => endDateInputRef.current?.focus()}
              onFocus={() => handleInputFocus(startDateInputRef)}
              onBlur={handleInputBlur}
              error={startDateError || datePreview.startError || undefined}
              helperText={
                startDate ? `Bắt đầu: ${formatDate(startDate)}` : undefined
              }
              editable={!isSubmitting}
            />

            <Input
              inputRef={endDateInputRef}
              label="Đến ngày (YYYY-MM-DD)"
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={(text) => {
                setEndDate(text);
                if (endDateError) setEndDateError(null);
                if (generalError) setGeneralError(null);
              }}
              rightIcon={
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.primary}
                />
              }
              onRightIconPress={() => setActivePicker("END")}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => reasonInputRef.current?.focus()}
              onFocus={() => handleInputFocus(endDateInputRef)}
              onBlur={handleInputBlur}
              error={endDateError || datePreview.endError || undefined}
              helperText={
                endDate ? `Kết thúc: ${formatDate(endDate)}` : undefined
              }
              editable={!isSubmitting}
            />
            <Text style={styles.sectionTitle} accessibilityLiveRegion="polite">
              Tổng ngày nghỉ dự kiến: {datePreview.days} ngày
            </Text>
            <Text>Chỉ tính Thứ Hai–Thứ Sáu, gồm ngày bắt đầu và kết thúc.</Text>
          </Card>

          {/* Card 3: Reason */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Lý do xin nghỉ *</Text>

            <Input
              inputRef={reasonInputRef}
              label="Nội dung lý do *"
              placeholder="Nhập lý do xin nghỉ phép cụ thể..."
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                if (reasonError) setReasonError(null);
                if (generalError) setGeneralError(null);
              }}
              error={reasonError || undefined}
              multiline
              numberOfLines={3}
              maxLength={500}
              style={styles.reasonInput}
              helperText={`${reason.trim().length}/500 ký tự (tối thiểu 10)`}
              editable={!isSubmitting}
              onFocus={() => handleInputFocus(reasonInputRef)}
              onBlur={handleInputBlur}
            />
          </Card>

          {/* Ảnh tùy chọn chỉ nằm trong form, có thể thay hoặc xóa trước khi gửi. */}
          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>Ảnh minh chứng (tùy chọn)</Text>
            <Text>Một ảnh JPG, PNG hoặc WebP, tối đa 5 MB.</Text>
            {attachment ? (
              <>
                <Image
                  source={{ uri: attachment.uri }}
                  style={styles.attachmentPreview}
                  resizeMode="contain"
                  accessibilityLabel="Ảnh minh chứng đã chọn"
                />
                <Text>{attachment.fileName}</Text>
                <Button
                  title="Xóa ảnh"
                  variant="outline"
                  disabled={isSubmitting || isPickingImage}
                  onPress={() => {
                    setAttachment(null);
                    setAttachmentError(null);
                  }}
                />
              </>
            ) : null}
            {attachmentError ? (
              <Text accessibilityRole="alert" style={styles.errorBannerText}>
                {attachmentError}
              </Text>
            ) : null}
            <Button
              title={attachment ? "Thay ảnh" : "Chọn ảnh"}
              variant="outline"
              onPress={handlePickImage}
              loading={isPickingImage}
              disabled={isSubmitting || isPickingImage}
            />
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <Button
              title="Gửi đơn nghỉ phép"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || isPickingImage || isSavedRef.current}
              style={styles.submitButton}
            />
            <Button
              title="Hủy bỏ"
              variant="outline"
              onPress={() => router.back()}
              disabled={isSubmitting}
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modals */}
      <DatePickerModal
        visible={activePicker === "START"}
        title="Chọn ngày bắt đầu"
        selectedDate={startDate}
        minDate={todayIso}
        onClose={() => setActivePicker(null)}
        onSelectDate={(newDate) => {
          setStartDate(newDate);
          if (endDate < newDate) {
            setEndDate(newDate);
          }
          if (startDateError) setStartDateError(null);
          if (endDateError) setEndDateError(null);
          if (generalError) setGeneralError(null);
        }}
      />

      <DatePickerModal
        visible={activePicker === "END"}
        title="Chọn ngày kết thúc"
        selectedDate={endDate}
        minDate={startDate || todayIso}
        onClose={() => setActivePicker(null)}
        onSelectDate={(newDate) => {
          setEndDate(newDate);
          if (endDateError) setEndDateError(null);
          if (generalError) setGeneralError(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  attachmentPreview: { width: "100%", height: 220, marginVertical: spacing.md },
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerSubtle,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorIcon: {
    marginRight: spacing.xs,
  },
  errorBannerText: {
    flex: 1,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  typeGrid: {
    gap: spacing.xs,
  },
  typeChip: {
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  typeChipSelected: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  typeChipContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeChipName: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  typeChipNameSelected: {
    color: colors.primary,
  },
  typeChipRemaining: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  typeChipRemainingSelected: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  buttonGroup: {
    gap: spacing.sm,
  },
  submitButton: {
    width: "100%",
  },
  reasonInput: {
    minHeight: 76,
    textAlignVertical: "top",
    paddingTop: spacing.xs,
  },
  cancelButton: {
    width: "100%",
  },
  typesLoadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  typesLoadingText: {
    fontSize: typography.sm.fontSize,
    color: colors.textSecondary,
  },
  typesErrorBox: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  typesErrorText: {
    fontSize: typography.sm.fontSize,
    color: colors.danger,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySubtle,
    marginTop: spacing.xs,
  },
  retryButtonText: {
    fontSize: typography.xs.fontSize,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
});

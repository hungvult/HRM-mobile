import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, InfoField } from "../../components";
import { colors, radius, spacing, typography } from "../../constants";
import { leaveService } from "../../services";
import { LeaveRequestDetail } from "../../types";
import {
  formatDateRange,
  formatDateTime,
  getFriendlyErrorMessage,
  getLeaveStatusConfig,
} from "../../utils";

export function LeaveDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const requestId = params.id ? Number(params.id) : null;

  const [detail, setDetail] = useState<LeaveRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!requestId) return;
    setError(null);
    try {
      const data = await leaveService.getLeaveRequestDetail(requestId);
      if (isMountedRef.current) {
        setDetail(data);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(
          getFriendlyErrorMessage(err, "Không thể tải chi tiết đơn nghỉ phép."),
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [requestId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDetail();
  }, [fetchDetail]);

  const performCancel = async () => {
    if (!requestId) return;
    setIsCancelling(true);
    try {
      await leaveService.cancelLeaveRequest(requestId);
      Alert.alert(
        "Thành công",
        "Đơn nghỉ phép của bạn đã được hủy thành công và hoàn trả số dư.",
        [
          {
            text: "Xác nhận",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (err: any) {
      const friendlyMsg = getFriendlyErrorMessage(
        err,
        "Không thể hủy đơn nghỉ phép. Vui lòng thử lại sau.",
      );

      if (
        err?.code === "LEAVE_REQUEST_NOT_CANCELLABLE" ||
        err?.status === 409
      ) {
        Alert.alert("Không thể hủy", friendlyMsg, [
          {
            text: "Đã hiểu",
            onPress: () => fetchDetail(),
          },
        ]);
      } else {
        Alert.alert("Lỗi", friendlyMsg);
      }
    } finally {
      if (isMountedRef.current) {
        setIsCancelling(false);
      }
    }
  };

  const handleCancelPress = () => {
    Alert.alert(
      "Xác nhận hủy đơn",
      `Bạn có chắc chắn muốn hủy đơn nghỉ phép #${detail?.requestCode}? Số ngày phép sẽ được hoàn trả lại vào quỹ phép của bạn.`,
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy đơn",
          style: "destructive",
          onPress: performCancel,
        },
      ],
    );
  };

  if (isLoading && !detail) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateMessage}>
            Đang tải chi tiết đơn nghỉ phép...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !detail) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
        <View style={styles.centerContainer}>
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>Không thể tải chi tiết</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Button
              title="Thử lại"
              onPress={fetchDetail}
              style={styles.retryButton}
            />
            <Button
              title="Quay lại"
              variant="outline"
              onPress={() => router.back()}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  if (!detail) return null;

  const statusConfig = getLeaveStatusConfig(detail.status);
  const isPending = detail.status === "PENDING";
  const dateRangeStr = formatDateRange(detail.startDate, detail.endDate);

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Status Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.requestCode}>#{detail.requestCode}</Text>
              <Text style={styles.typeName}>
                {detail.leaveTypeName || detail.leaveTypeCode}
              </Text>
            </View>

            <View
              style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}
            >
              <Text style={[styles.statusText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </Card>

        {/* Rejection Reason Alert if rejected */}
        {detail.rejectionReason ? (
          <View style={styles.rejectionCard}>
            <Ionicons
              name="alert-circle"
              size={20}
              color={colors.danger}
              style={styles.rejectionIcon}
            />
            <View style={styles.rejectionContent}>
              <Text style={styles.rejectionTitle}>Lý do từ chối:</Text>
              <Text style={styles.rejectionText}>{detail.rejectionReason}</Text>
            </View>
          </View>
        ) : null}

        {/* Card 1: Leave Details */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Thông tin đơn nghỉ</Text>
          <InfoField label="Khoảng ngày nghỉ" value={dateRangeStr} />
          <InfoField
            label="Số ngày xin nghỉ"
            value={`${detail.requestedDays} ngày`}
          />
          <InfoField
            label="Thời gian gửi đơn"
            value={formatDateTime(detail.createdAt)}
          />
          <InfoField label="Lý do xin nghỉ" value={detail.reason} isLast />
        </Card>

        {/* Card 2: Approval Timeline */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tiến trình duyệt đơn</Text>
          {detail.statusHistory && detail.statusHistory.length > 0 ? (
            <View style={styles.timelineList}>
              {detail.statusHistory.map((history, idx) => {
                const histStatusConfig = getLeaveStatusConfig(
                  history.newStatus,
                );
                const isLast = idx === detail.statusHistory.length - 1;

                return (
                  <View key={`hist-${idx}`} style={styles.timelineItem}>
                    <View style={styles.timelineTrack}>
                      <View
                        style={[
                          styles.timelineDot,
                          { backgroundColor: histStatusConfig.text },
                        ]}
                      />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>

                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <View
                          style={[
                            styles.histBadge,
                            { backgroundColor: histStatusConfig.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.histBadgeText,
                              { color: histStatusConfig.text },
                            ]}
                          >
                            {histStatusConfig.label}
                          </Text>
                        </View>
                        <Text style={styles.timelineTime}>
                          {formatDateTime(history.changedAt)}
                        </Text>
                      </View>

                      <Text style={styles.timelineActor}>
                        Người thực hiện:{" "}
                        <Text style={styles.actorName}>
                          {history.changedByEmployeeName || "Hệ thống"}
                        </Text>
                      </Text>

                      {Boolean(history.note) && (
                        <Text style={styles.timelineNote}>
                          Ghi chú: {history.note}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyNote}>
              Chưa có lịch sử thay đổi trạng thái.
            </Text>
          )}
        </Card>

        {/* Action Button Section */}
        <View style={styles.actionSection}>
          {isPending ? (
            <Button
              title="Hủy đơn nghỉ phép"
              variant="danger"
              onPress={handleCancelPress}
              loading={isCancelling}
            />
          ) : (
            <Card style={styles.noticeCard}>
              <Text style={styles.noticeText}>
                Đơn đã được xử lý ({statusConfig.label}). Không thể chỉnh sửa
                hoặc hủy bỏ.
              </Text>
            </Card>
          )}
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  headerCard: {
    marginBottom: spacing.lg,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  requestCode: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  typeName: {
    fontSize: typography.xl.fontSize,
    lineHeight: typography.xl.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: typography.xs.fontSize,
    fontWeight: typography.weights.semibold,
  },
  rejectionCard: {
    flexDirection: "row",
    backgroundColor: colors.dangerSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  rejectionIcon: {
    marginRight: spacing.xs,
    marginTop: 2,
  },
  rejectionContent: {
    flex: 1,
  },
  rejectionTitle: {
    fontSize: typography.sm.fontSize,
    fontWeight: typography.weights.bold,
    color: colors.danger,
    marginBottom: 2,
  },
  rejectionText: {
    fontSize: typography.sm.fontSize,
    color: colors.danger,
    lineHeight: 20,
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
  timelineList: {
    marginTop: spacing.xs,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 52,
  },
  timelineTrack: {
    width: 20,
    alignItems: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    marginTop: 5,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: spacing.xs,
    paddingBottom: spacing.md,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  histBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  histBadgeText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  timelineTime: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
  },
  timelineActor: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actorName: {
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  timelineNote: {
    fontSize: typography.xs.fontSize,
    color: colors.textPrimary,
    marginTop: 2,
    fontStyle: "italic",
  },
  emptyNote: {
    fontSize: typography.xs.fontSize,
    color: colors.textDisabled,
    fontStyle: "italic",
  },
  actionSection: {
    marginTop: spacing.sm,
  },
  noticeCard: {
    backgroundColor: colors.bgApp,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: "center",
  },
  noticeText: {
    fontSize: typography.xs.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

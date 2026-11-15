import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { NotificationItemCard } from "../../components/notifications";
import { colors, radius, spacing, typography } from "../../constants";
import { useNotifications } from "../../hooks/use-notifications";
import { formatDateTime, getNotificationTypeConfig } from "../../utils";

/** Hiển thị nội dung thông báo trước; chỉ nút trong chi tiết mới mở đơn nghỉ phép liên quan. */
export function NotificationsScreen() {
  const router = useRouter();
  const {
    unreadCount,
    notifications,
    hasNext,
    isListLoading,
    isRefreshing,
    isLoadingMore,
    isMarkingAllRead,
    listError,
    loadMore,
    refresh,
    retryList,
    markOneAsUnread,
    isUpdatingRead,
    selectedNotification,
    isDetailLoading,
    detailModalVisible,
    detailError,
    actionError,
    openDetail,
    closeDetail,
    markAllAsRead,
  } = useNotifications();

  // Khóa thao tác trong lúc PATCH đang chạy; hook xếp thứ tự để đọc tất cả không ghi đè lần chưa đọc mới.
  const isReadAllDisabled = unreadCount === 0 || isUpdatingRead;

  /** relatedEntity.id là ID đơn; ID thông báo vẫn chỉ dùng cho GET/PATCH thông báo. */
  const openRelatedEntity = () => {
    const entity = selectedNotification?.relatedEntity;
    if (
      entity?.type !== "LEAVE_REQUEST" ||
      !Number.isSafeInteger(entity.id) ||
      entity.id <= 0
    )
      return;
    closeDetail();
    router.push({
      pathname: "/leave-detail",
      params: { id: String(entity.id) },
    });
  };

  const renderHeaderBar = () => (
    <View style={styles.topActionBar}>
      <View style={styles.leftTitleGroup}>
        <Text style={styles.subTitleText}>
          {unreadCount > 0
            ? `${unreadCount} thông báo mới`
            : "Không có thông báo mới"}
        </Text>
      </View>

      <TouchableOpacity
        onPress={markAllAsRead}
        disabled={isReadAllDisabled}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[
          styles.readAllButton,
          isReadAllDisabled && styles.readAllButtonDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Đọc tất cả thông báo"
      >
        {isMarkingAllRead ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text
            style={[
              styles.readAllButtonText,
              isReadAllDisabled && styles.readAllButtonTextDisabled,
            ]}
          >
            Đọc tất cả
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => {
    if (isListLoading || listError) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="notifications-off-outline"
          size={56}
          color={colors.textDisabled}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
        <Text style={styles.emptySubtitle}>
          Bạn sẽ nhận được thông báo khi đơn nghỉ phép được duyệt hoặc có tin
          tức từ công ty.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={styles.listBottomSpacer} />;

    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadMoreText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom", "left", "right"]}>
      {renderHeaderBar()}

      {/* Partial List Error Banner */}
      {listError && notifications.length === 0 && (
        <View style={styles.listErrorBox}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={colors.danger}
            style={styles.listErrorIcon}
          />
          <View style={styles.listErrorContent}>
            <Text style={styles.listErrorText}>{listError}</Text>
            <Pressable onPress={retryList} style={styles.listRetryBtn}>
              <Text style={styles.listRetryText}>Thử lại</Text>
            </Pressable>
          </View>
        </View>
      )}

      {actionError && !detailModalVisible && (
        <Text style={styles.modalErrorText} accessibilityRole="alert">
          {actionError}
        </Text>
      )}

      {/* Loading Skeleton/Spinner on first load */}
      {isListLoading && notifications.length === 0 && !listError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      )}

      {/* Main Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <NotificationItemCard item={item} onPress={openDetail} />
        )}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* Mọi loại thông báo đều có chi tiết và thao tác chưa đọc, kể cả thông báo có đơn liên quan. */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalIconBox,
                      {
                        backgroundColor: getNotificationTypeConfig(
                          selectedNotification.type,
                        ).iconBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        getNotificationTypeConfig(selectedNotification.type)
                          .icon
                      }
                      size={24}
                      color={
                        getNotificationTypeConfig(selectedNotification.type)
                          .iconColor
                      }
                    />
                  </View>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {selectedNotification.title}
                  </Text>
                </View>

                <ScrollView style={styles.modalScroll}>
                  {isDetailLoading ? (
                    <View style={styles.modalLoading}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : detailError ? (
                    <Text style={styles.modalErrorText}>{detailError}</Text>
                  ) : (
                    <>
                      <Text style={styles.modalBodyText}>
                        {selectedNotification.content}
                      </Text>
                      <Text style={styles.modalDateText}>
                        {formatDateTime(selectedNotification.createdAt)}
                      </Text>
                    </>
                  )}
                </ScrollView>
                {actionError && (
                  <Text style={styles.modalErrorText} accessibilityRole="alert">
                    {actionError}
                  </Text>
                )}
                {!isDetailLoading && !detailError && (
                  <>
                    <Text style={styles.modalDateText}>
                      {selectedNotification.read ? "Đã đọc" : "Chưa đọc"}
                    </Text>
                    <TouchableOpacity
                      style={styles.modalSecondaryBtn}
                      onPress={() => markOneAsUnread(selectedNotification.id)}
                      disabled={isUpdatingRead || !selectedNotification.read}
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled: isUpdatingRead || !selectedNotification.read,
                      }}
                      accessibilityLabel="Đánh dấu chưa đọc"
                    >
                      <Text style={styles.readAllButtonText}>
                        Đánh dấu chưa đọc
                      </Text>
                    </TouchableOpacity>
                    {selectedNotification.relatedEntity?.type ===
                      "LEAVE_REQUEST" &&
                      selectedNotification.relatedEntity.id > 0 && (
                        <TouchableOpacity
                          style={styles.modalSecondaryBtn}
                          onPress={openRelatedEntity}
                          accessibilityRole="button"
                          accessibilityLabel="Mở đơn nghỉ phép liên quan"
                        >
                          <Text style={styles.readAllButtonText}>
                            Mở đơn nghỉ phép liên quan
                          </Text>
                        </TouchableOpacity>
                      )}
                  </>
                )}
                {detailError && (
                  <TouchableOpacity
                    style={styles.modalSecondaryBtn}
                    onPress={() => openDetail(selectedNotification)}
                    accessibilityRole="button"
                    accessibilityLabel="Thử lại tải thông báo"
                  >
                    <Text>Thử lại</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Đóng chi tiết thông báo"
                  style={styles.modalCloseBtn}
                  onPress={closeDetail}
                >
                  <Text style={styles.modalCloseBtnText}>Đóng</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  topActionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftTitleGroup: {
    flex: 1,
  },
  subTitleText: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  readAllButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  readAllButtonDisabled: {
    opacity: 0.4,
  },
  readAllButtonText: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  readAllButtonTextDisabled: {
    color: colors.textDisabled,
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.lg.fontSize,
    lineHeight: typography.lg.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loadMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  loadMoreText: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  listBottomSpacer: {
    height: spacing.xl,
  },
  listErrorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.dangerSubtle,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  listErrorIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  listErrorContent: {
    flex: 1,
  },
  listErrorText: {
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    fontWeight: typography.weights.medium,
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  listRetryBtn: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: radius.sm,
  },
  listRetryText: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    fontWeight: typography.weights.semibold,
    color: colors.danger,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  modalTitle: {
    flex: 1,
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  modalLoading: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  modalErrorText: {
    color: colors.danger,
    fontSize: typography.sm.fontSize,
    lineHeight: typography.sm.lineHeight,
    marginBottom: spacing.md,
  },
  modalBodyText: {
    fontSize: typography.sm.fontSize,
    lineHeight: 22,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalDateText: {
    fontSize: typography.xs.fontSize,
    lineHeight: typography.xs.lineHeight,
    color: colors.textDisabled,
    marginBottom: spacing.lg,
  },
  modalScroll: { flexGrow: 0 },
  modalSecondaryBtn: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  modalCloseBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  modalCloseBtnText: {
    color: "#FFFFFF",
    fontSize: typography.base.fontSize,
    lineHeight: typography.base.lineHeight,
    fontWeight: typography.weights.semibold,
  },
});

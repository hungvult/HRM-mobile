import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Employee, UserProfile } from "../types";
import { userService } from "../services";
import { useAuth } from "../hooks/use-auth";
import { getFriendlyErrorMessage } from "../utils";
import { authStorage } from "../services/auth-storage";

export interface UserContextType {
  user: UserProfile | null;
  employee: Employee | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateUser: (updatedProfile: UserProfile) => void;
  clearUser: () => void;
}

export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const fetchVersionRef = useRef(0);

  // Chỉ ghi hồ sơ của lượt tải và phiên hiện tại; phản hồi sau logout không được đưa dữ liệu cũ trở lại.
  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const fetchVersion = ++fetchVersionRef.current;
    const sessionVersion = authStorage.getSessionVersion();

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const profile = await userService.getMe();
      if (
        fetchVersion === fetchVersionRef.current &&
        authStorage.isCurrentSession(sessionVersion)
      )
        setUser(profile);
    } catch (err: any) {
      if (
        fetchVersion === fetchVersionRef.current &&
        authStorage.isCurrentSession(sessionVersion)
      ) {
        setError(
          getFriendlyErrorMessage(err, "Không thể tải thông tin người dùng."),
        );
      }
    } finally {
      if (fetchVersion === fetchVersionRef.current) {
        if (isRefresh) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
        isFetchingRef.current = false;
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchProfile(true);
  }, [fetchProfile]);

  const updateUser = useCallback((updatedProfile: UserProfile) => {
    setUser(updatedProfile);
  }, []);

  // Xóa UI và vô hiệu lượt tải đang chạy; lượt cũ không được mở khóa hoặc ghi đè lượt tải của tài khoản mới.
  const clearUser = useCallback(() => {
    fetchVersionRef.current += 1;
    setUser(null);
    setError(null);
    setIsLoading(false);
    setIsRefreshing(false);
    isFetchingRef.current = false;
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile(false);
    } else {
      clearUser();
    }
  }, [isAuthenticated, fetchProfile, clearUser]);

  return (
    <UserContext.Provider
      value={{
        user,
        employee: user?.employee ?? null,
        isLoading,
        isRefreshing,
        error,
        refreshUser,
        updateUser,
        clearUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

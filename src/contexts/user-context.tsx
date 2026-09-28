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

export interface UserContextType {
  user: UserProfile | null;
  employee: Employee | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
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

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const profile = await userService.getMe();
      setUser(profile);
    } catch (err: any) {
      setError(err?.message || "Không thể tải thông tin người dùng.");
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchProfile(true);
  }, [fetchProfile]);

  const clearUser = useCallback(() => {
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
        clearUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

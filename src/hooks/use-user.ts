import { useContext } from "react";
import { UserContext, UserContextType } from "../contexts/user-context";

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser phải được sử dụng bên trong UserProvider");
  }
  return context;
}

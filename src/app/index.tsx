import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../hooks";

export default function Index() {
  // Route gốc luôn chọn một nhóm được phép, tránh để index trắng ngoài hai nhóm Protected của root Stack.
  const { isAuthenticated } = useAuth();
  return <Redirect href={isAuthenticated ? "/(app)" : "/(auth)/login"} />;
}

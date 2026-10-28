import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "react-native": path.resolve(__dirname, "tests/mocks/react-native.ts"),
      "expo-secure-store": path.resolve(
        __dirname,
        "tests/mocks/expo-secure-store.ts",
      ),
      "expo-location": path.resolve(__dirname, "tests/mocks/expo-location.ts"),
      "expo-network": path.resolve(__dirname, "tests/mocks/expo-network.ts"),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    alias: {
      "@": path.resolve(__dirname, "src"),
      "react-native": path.resolve(__dirname, "tests/mocks/react-native.ts"),
      "expo-secure-store": path.resolve(
        __dirname,
        "tests/mocks/expo-secure-store.ts",
      ),
      "expo-location": path.resolve(__dirname, "tests/mocks/expo-location.ts"),
      "expo-network": path.resolve(__dirname, "tests/mocks/expo-network.ts"),
    },
  },
});

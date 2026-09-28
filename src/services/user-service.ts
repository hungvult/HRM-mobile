import { UserProfile } from "../types";
import { request } from "./api";

export const userService = {
  async getMe(): Promise<UserProfile> {
    return await request<UserProfile>("/users/me", {
      method: "GET",
      requiresAuth: true,
    });
  },
};

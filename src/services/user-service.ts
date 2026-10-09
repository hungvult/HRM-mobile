import { UpdateMyProfileRequest, UserProfile } from "../types";
import { request } from "./api";

export const userService = {
  async getMe(): Promise<UserProfile> {
    return await request<UserProfile>("/users/me", {
      method: "GET",
      requiresAuth: true,
    });
  },

  async updateProfile(data: UpdateMyProfileRequest): Promise<UserProfile> {
    return await request<UserProfile>("/me/profile", {
      method: "PUT",
      body: JSON.stringify({
        phone: data.phone.trim(),
        address: data.address.trim(),
      }),
      requiresAuth: true,
    });
  },
};

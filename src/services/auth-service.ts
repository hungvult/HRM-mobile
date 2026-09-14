import { AuthUser, LoginRequest, LoginResponse } from '../types';
import { request } from './api';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      requiresAuth: false,
    });
  },

  async logout(): Promise<void> {
    await request<void>('/auth/logout', {
      method: 'POST',
      requiresAuth: true,
    });
  },

  async getMe(): Promise<AuthUser> {
    return await request<AuthUser>('/users/me', {
      method: 'GET',
      requiresAuth: true,
    });
  },

  async refreshToken(): Promise<LoginResponse> {
    return await request<LoginResponse>('/auth/refresh', {
      method: 'POST',
      requiresAuth: false,
    });
  },
};

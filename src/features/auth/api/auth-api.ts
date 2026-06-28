import { apiFetch, apiFetchWithRefresh } from '@/lib/api-client';
import type { AuthUser, LoginResponseData } from '@/types/auth';
import type { ChangePasswordInput, ForgotPasswordInput, LoginInput, LogoutInput, ResetPasswordInput } from '@/validators/auth.validator';
import type { UpdateProfileInput } from '@/validators/profile.validator';

export const authApi = {
  login(input: LoginInput) {
    return apiFetch<LoginResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  logout(input: LogoutInput = { allDevices: false }) {
    return apiFetch<null>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  refresh() {
    return apiFetch<null>('/auth/refresh', { method: 'POST' });
  },

  me() {
    return apiFetchWithRefresh<AuthUser>('/auth/me');
  },

  forgotPassword(input: ForgotPasswordInput) {
    return apiFetch<null>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  resetPassword(input: ResetPasswordInput) {
    return apiFetch<null>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  changePassword(input: ChangePasswordInput) {
    return apiFetch<null>('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
};

export const profileApi = {
  get() {
    return apiFetchWithRefresh<AuthUser>('/profile');
  },

  update(input: UpdateProfileInput) {
    return apiFetchWithRefresh<AuthUser>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetchWithRefresh<{ avatar: string }>('/profile/avatar', {
      method: 'POST',
      body: formData,
    });
  },
};

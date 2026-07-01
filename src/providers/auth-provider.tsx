'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getDashboardPathForRole } from '@/constants/auth-routes';
import { authApi, profileApi } from '@/features/auth/api/auth-api';
import { ApiClientError } from '@/lib/api-client';
import { hasPermission } from '@/services/auth/permission.service';
import type { AuthUser } from '@/types/auth';
import type { LoginInput, LogoutInput } from '@/validators/auth.validator';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: (options?: LogoutInput) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [initialized, setInitialized] = useState(false);

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await authApi.me();
        return response.data;
      } catch (error) {
        if (error instanceof ApiClientError && error.statusCode === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isLoading) {
      setInitialized(true);
    }
  }, [isLoading]);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      const role = response.data?.user.role;
      if (role) {
        router.push(getDashboardPathForRole(role));
      } else {
        router.push('/dashboard');
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      queryClient.setQueryData(['auth', 'me'], null);
      router.push('/login');
    },
  });

  const login = useCallback(
    async (input: LoginInput) => {
      await loginMutation.mutateAsync(input);
    },
    [loginMutation],
  );

  const logout = useCallback(
    async (options?: LogoutInput) => {
      await logoutMutation.mutateAsync(options ?? { allDevices: false });
    },
    [logoutMutation],
  );

  const refreshUser = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const checkPermission = useCallback(
    (permission: string) => {
      if (!user?.permissions) return false;
      return hasPermission(user.permissions, permission);
    },
    [user?.permissions],
  );

  const checkAnyPermission = useCallback(
    (permissions: string[]) => {
      return permissions.some((perm) => checkPermission(perm));
    },
    [checkPermission],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading: isLoading || !initialized,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
      hasPermission: checkPermission,
      hasAnyPermission: checkAnyPermission,
    }),
    [
      user,
      isLoading,
      initialized,
      login,
      logout,
      refreshUser,
      checkPermission,
      checkAnyPermission,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { profileApi };

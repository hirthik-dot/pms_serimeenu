import { redirect } from 'next/navigation';

import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect('/forgot-password');
  }

  return <ResetPasswordForm token={token} />;
}

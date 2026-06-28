import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Dental PMS',
  description: 'Sign in to your Dental Practice Management System account',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-accent)_0%,_transparent_50%)] opacity-60" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

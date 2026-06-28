'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/auth-provider';

export default function SupportDashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader
          title="Support Dashboard"
          description="Read-only access for troubleshooting and customer support"
        />
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.firstName}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Support tools and read-only views will be available in a future release.
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

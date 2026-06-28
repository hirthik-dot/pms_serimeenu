'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/auth-provider';

export default function PatientDashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader
          title="Patient Portal"
          description="View your appointments and billing information"
        />
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.firstName}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Your patient portal is ready. Appointment and billing views will be enabled in a future release.
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

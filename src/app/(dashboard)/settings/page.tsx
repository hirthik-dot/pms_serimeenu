'use client';

import { useQuery } from '@tanstack/react-query';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetchWithRefresh } from '@/lib/api-client';
import type { IClinicSettings } from '@/types/models';

export default function SettingsPage() {
  const { data } = useQuery({
    queryKey: ['settings', 'clinic'],
    queryFn: () => apiFetchWithRefresh<IClinicSettings>('/settings/clinic'),
  });

  const clinic = data?.data;

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader title="Clinic Settings" description="Profile, GST, branding, and configuration" />
        {clinic && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Clinic Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Name:</strong> {clinic.clinicName}</p>
                <p><strong>Phone:</strong> {clinic.phone}</p>
                <p><strong>Email:</strong> {clinic.email}</p>
                <p><strong>Address:</strong> {clinic.address?.street}, {clinic.address?.city}</p>
                <p><strong>Working Hours:</strong> {clinic.workingHours?.start} – {clinic.workingHours?.end}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">GST & Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>GST Enabled:</strong> {clinic.gstEnabled ? 'Yes' : 'No'}</p>
                <p><strong>GST Number:</strong> {clinic.gstNumber ?? '—'}</p>
                <p><strong>GST Rate:</strong> {clinic.gstRate}%</p>
                <p><strong>Currency:</strong> {clinic.currencySymbol} ({clinic.currency})</p>
                <p><strong>Departments:</strong> {clinic.departments?.join(', ')}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

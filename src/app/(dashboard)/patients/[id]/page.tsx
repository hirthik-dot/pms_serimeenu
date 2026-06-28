'use client';

import { use } from 'react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PatientProfileView } from '@/features/patients/components/patient-profile-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PatientDetailPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <AuthGuard>
      <PatientProfileView patientId={id} />
    </AuthGuard>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { patientApi } from '@/features/patients/api/patient-api';
import { PatientForm } from '@/features/patients/components/patient-form';
import { ApiClientError } from '@/lib/api-client';
import type { CreatePatientInput } from '@/validators/patient.validator';

export default function NewPatientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: CreatePatientInput) {
    setIsSubmitting(true);
    try {
      const response = await patientApi.create(data);
      toast.success('Patient registered successfully');
      router.push(`/patients/${response.data!.id}`);
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Registration failed');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="New Patient Registration"
          description="Register a new adult or pediatric patient"
        />
        <PatientForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Register Patient"
        />
      </div>
    </AuthGuard>
  );
}

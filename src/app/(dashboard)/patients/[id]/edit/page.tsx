'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { toast } from 'sonner';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PageHeader, LoadingSkeleton } from '@/components/shared/page-header';
import { patientApi } from '@/features/patients/api/patient-api';
import { PatientForm } from '@/features/patients/components/patient-form';
import { ApiClientError } from '@/lib/api-client';
import type { CreatePatientInput } from '@/validators/patient.validator';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPatientPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['patients', id],
    queryFn: () => patientApi.get(id),
  });

  async function handleSubmit(formData: CreatePatientInput) {
    try {
      await patientApi.update(id, formData);
      toast.success('Patient updated successfully');
      router.push(`/patients/${id}`);
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Update failed');
      throw error;
    }
  }

  return (
    <AuthGuard>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Edit Patient" description="Update patient registration details" />
        {isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : data?.data ? (
          <PatientForm
            defaultValues={data.data}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        ) : null}
      </div>
    </AuthGuard>
  );
}

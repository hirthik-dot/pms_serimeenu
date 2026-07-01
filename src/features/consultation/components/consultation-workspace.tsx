'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { consultationApi } from '@/features/consultation/api/consultation-api';
import { ClinicalHistoryPanel } from '@/features/consultation/components/clinical-history-panel';
import {
  ConsultationCenterTabs,
  consultationFromRecord,
  formToDraftInput,
  type ConsultationFormState,
} from '@/features/consultation/components/consultation-center-tabs';
import { ConsultationRightPanel } from '@/features/consultation/components/consultation-right-panel';
import { PatientSummaryPanel } from '@/features/consultation/components/patient-summary-panel';
import { useAutoSave } from '@/features/consultation/hooks/use-auto-save';
import { useConsultationKeyboard } from '@/features/consultation/hooks/use-consultation-keyboard';
import { patientApi } from '@/features/patients/api/patient-api';
import { ApiClientError } from '@/lib/api-client';
import type { PrescriptionMedicationDto, TreatmentPlanItemDto } from '@/types/consultation';
import { ConsultationDisplayStatus } from '@/types/enums';
import { type XrayRequestType } from '@/types/enums';

interface ConsultationWorkspaceProps {
  visitId: string;
}

export function ConsultationWorkspace({ visitId }: ConsultationWorkspaceProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ConsultationFormState | null>(null);
  const [prescriptionMeds, setPrescriptionMeds] = useState<PrescriptionMedicationDto[]>([]);
  const [prescriptionInstructions, setPrescriptionInstructions] = useState('');
  const [planName, setPlanName] = useState('Treatment Plan');
  const [planDescription, setPlanDescription] = useState('');
  const [planItems, setPlanItems] = useState<TreatmentPlanItemDto[]>([]);

  const { data: workspaceResponse, isLoading, refetch } = useQuery({
    queryKey: ['consultation', visitId, 'workspace'],
    queryFn: () => consultationApi.getWorkspace(visitId),
    refetchInterval: 30000,
  });

  const workspace = workspaceResponse?.data;
  const patientId = workspace?.visit.patient.id;

  const { data: medicalHistoryResponse } = useQuery({
    queryKey: ['patients', patientId, 'medical-history'],
    queryFn: () => patientApi.getMedicalHistory(patientId!),
    enabled: Boolean(patientId),
  });

  const { data: timelineResponse } = useQuery({
    queryKey: ['patients', patientId, 'timeline'],
    queryFn: () => patientApi.getTimeline(patientId!, { limit: 10 }),
    enabled: Boolean(patientId),
  });

  useEffect(() => {
    if (!workspace) return;

    setForm(consultationFromRecord(workspace.consultation, workspace.visit.chiefComplaint));

    if (workspace.prescription) {
      setPrescriptionMeds(workspace.prescription.medications);
      setPrescriptionInstructions(workspace.prescription.generalInstructions ?? '');
    }

    if (workspace.treatmentPlan) {
      setPlanName(workspace.treatmentPlan.name);
      setPlanDescription(workspace.treatmentPlan.description ?? '');
      setPlanItems(workspace.treatmentPlan.treatments);
    }
  }, [workspace]);

  const startMutation = useMutation({
    mutationFn: () => consultationApi.startVisit(visitId),
    onSuccess: () => {
      void refetch();
      toast.success('Consultation started');
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiClientError ? e.message : 'Failed to start'),
  });

  const saveAll = useCallback(async () => {
    if (!form) return;

    await consultationApi.saveDraft(visitId, formToDraftInput(form));

    if (prescriptionMeds.some((m) => m.name.trim())) {
      await consultationApi.savePrescription(visitId, {
        medications: prescriptionMeds.filter((m) => m.name.trim()),
        generalInstructions: prescriptionInstructions || undefined,
      });
    }

    if (planItems.some((i) => i.procedureName.trim())) {
      const payload = {
        name: planName,
        description: planDescription || undefined,
        treatments: planItems.filter((i) => i.procedureName.trim()),
      };

      if (workspace?.treatmentPlan) {
        await consultationApi.updateTreatmentPlan(visitId, payload);
      } else {
        await consultationApi.createTreatmentPlan(visitId, payload);
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['consultation', visitId] });
  }, [
    form,
    visitId,
    prescriptionMeds,
    prescriptionInstructions,
    planName,
    planDescription,
    planItems,
    workspace?.treatmentPlan,
    queryClient,
  ]);

  const { state: autoSaveState, markUnsaved, saveNow, recoverDraft, clearDraft } = useAutoSave({
    visitId,
    data: form,
    onSave: saveAll,
    enabled: Boolean(form),
  });

  useEffect(() => {
    if (!form) return;
    const recovered = recoverDraft();
    if (recovered && JSON.stringify(recovered) !== JSON.stringify(form)) {
      const shouldRecover = window.confirm('Recover unsaved changes from your last session?');
      if (shouldRecover) {
        setForm(recovered);
        toast.info('Draft recovered');
      } else {
        clearDraft();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when form initializes
  }, [Boolean(form)]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      await saveNow();
      return consultationApi.completeVisit(visitId);
    },
    onSuccess: () => {
      clearDraft();
      toast.success('Consultation completed');
      void refetch();
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiClientError ? e.message : 'Failed to complete'),
  });

  const xrayMutation = useMutation({
    mutationFn: (data: {
      type: XrayRequestType;
      customType?: string;
      toothNumbers: number[];
      notes?: string;
    }) => consultationApi.createXrayRequest(visitId, data),
    onSuccess: () => {
      toast.success('X-ray request sent to reception');
      void refetch();
    },
    onError: (e: Error) =>
      toast.error(e instanceof ApiClientError ? e.message : 'Request failed'),
  });

  const handlePrint = async () => {
    await saveNow();
    document.body.classList.add('print-prescription');
    window.print();
    document.body.classList.remove('print-prescription');
  };

  useConsultationKeyboard({
    onSave: () => void saveNow(),
    onPrintPrescription: handlePrint,
    onSearchPatient: () => {
      document.querySelector<HTMLInputElement>('[aria-label="Search clinical history"]')?.focus();
    },
    onComplete: () => completeMutation.mutate(),
    enabled: Boolean(workspace),
  });

  if (isLoading || !workspace || !form) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isEditable =
    workspace.visit.consultationStatus !== ConsultationDisplayStatus.Completed &&
    workspace.visit.consultationStatus !== ConsultationDisplayStatus.Cancelled;

  const timelinePreview =
    timelineResponse?.data?.map((e) => ({ date: e.date, summary: e.summary })) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/doctor" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{workspace.visit.patient.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              Visit #{workspace.visit.visitNumber} · {workspace.visit.chiefComplaint}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {workspace.visit.consultationStatus === ConsultationDisplayStatus.Draft && (
            <Button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              Start Consultation
            </Button>
          )}
          {isEditable && (
            <>
              <Button variant="outline" onClick={() => void saveNow()} disabled={autoSaveState === 'saving'}>
                <Save className="mr-1 h-4 w-4" />
                Save
              </Button>
              <Button
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isPending}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Complete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_1fr_300px]">
        <aside className="order-1 xl:order-none">
          <PatientSummaryPanel
            workspace={workspace}
            medicalHistory={medicalHistoryResponse?.data}
            timelinePreview={timelinePreview}
          />
          <Card className="mt-4 p-4">
            <ClinicalHistoryPanel
              patientId={workspace.visit.patient.id}
              onCopyNote={(text) => {
                setForm((f) => (f ? { ...f, clinicalNotes: text } : f));
                markUnsaved();
              }}
            />
          </Card>
        </aside>

        <main className="order-2 min-w-0">
          <Card className="p-4 md:p-6">
            {isEditable ? (
              <ConsultationCenterTabs
                form={form}
                onFormChange={(patch) => setForm((f) => (f ? { ...f, ...patch } : f))}
                onMarkUnsaved={markUnsaved}
                prescriptionMedications={prescriptionMeds}
                prescriptionInstructions={prescriptionInstructions}
                onPrescriptionChange={(meds, instructions) => {
                  setPrescriptionMeds(meds);
                  setPrescriptionInstructions(instructions);
                  markUnsaved();
                }}
                onPrintPrescription={handlePrint}
                treatmentPlanName={planName}
                treatmentPlanDescription={planDescription}
                treatmentPlanItems={planItems}
                onTreatmentPlanChange={(name, description, items) => {
                  setPlanName(name);
                  setPlanDescription(description);
                  setPlanItems(items);
                  markUnsaved();
                }}
                consultation={workspace.consultation}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                This consultation is {workspace.visit.consultationStatus.replace('_', ' ')} and is read-only.
              </p>
            )}
          </Card>
        </main>

        <aside className="order-3">
          <ConsultationRightPanel
            workspace={workspace}
            autoSaveState={autoSaveState}
            isEditable={isEditable}
            onRequestXray={(data) => xrayMutation.mutate(data)}
            onRefresh={() => void refetch()}
          />
        </aside>
      </div>

      <p className="text-center text-xs text-muted-foreground print:hidden">
        Shortcuts: Ctrl+S Save · Ctrl+P Print · Ctrl+/ Search history · Ctrl+Enter Complete
      </p>
    </div>
  );
}

export function ConsultationWorkspacePage({ visitId }: ConsultationWorkspaceProps) {
  return (
    <AuthGuard>
      <ConsultationWorkspace visitId={visitId} />
    </AuthGuard>
  );
}

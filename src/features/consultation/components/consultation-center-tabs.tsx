'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PrescriptionBuilder } from '@/features/consultation/components/prescription-builder';
import { TreatmentPlanEditor } from '@/features/consultation/components/treatment-plan-editor';
import { NOTE_SNIPPETS, NOTE_TEMPLATES } from '@/features/consultation/constants';
import type {
  ConsultationRecord,
  PrescriptionMedicationDto,
  TreatmentPlanItemDto,
} from '@/types/consultation';

export interface ConsultationFormState {
  chiefComplaint: string;
  presentIllness: string;
  clinicalFindings: string;
  diagnosis: string;
  clinicalNotes: string;
  additionalNotes: string;
  treatmentRecommendation: string;
  advice: string;
  followUpDate: string;
  followUpTime: string;
  followUpPurpose: string;
  followUpReminder: boolean;
  followUpNotes: string;
}

interface ConsultationCenterTabsProps {
  form: ConsultationFormState;
  onFormChange: (patch: Partial<ConsultationFormState>) => void;
  onMarkUnsaved: () => void;
  prescriptionMedications: PrescriptionMedicationDto[];
  prescriptionInstructions: string;
  onPrescriptionChange: (meds: PrescriptionMedicationDto[], instructions: string) => void;
  onPrintPrescription: () => void;
  treatmentPlanName: string;
  treatmentPlanDescription: string;
  treatmentPlanItems: TreatmentPlanItemDto[];
  onTreatmentPlanChange: (name: string, description: string, items: TreatmentPlanItemDto[]) => void;
  consultation: ConsultationRecord;
}

export function ConsultationCenterTabs({
  form,
  onFormChange,
  onMarkUnsaved,
  prescriptionMedications,
  prescriptionInstructions,
  onPrescriptionChange,
  onPrintPrescription,
  treatmentPlanName,
  treatmentPlanDescription,
  treatmentPlanItems,
  onTreatmentPlanChange,
}: ConsultationCenterTabsProps) {
  const update = (patch: Partial<ConsultationFormState>) => {
    onFormChange(patch);
    onMarkUnsaved();
  };

  return (
    <Tabs defaultValue="complaint" className="w-full">
      <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
        <TabsTrigger value="complaint">Chief Complaint</TabsTrigger>
        <TabsTrigger value="findings">Clinical Findings</TabsTrigger>
        <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
        <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
        <TabsTrigger value="prescription">Prescription</TabsTrigger>
        <TabsTrigger value="notes">Doctor Notes</TabsTrigger>
        <TabsTrigger value="advice">Advice</TabsTrigger>
        <TabsTrigger value="followup">Follow-up</TabsTrigger>
      </TabsList>

      <TabsContent value="complaint" className="space-y-4">
        <Field label="Chief Complaint">
          <Textarea
            value={form.chiefComplaint}
            onChange={(e) => update({ chiefComplaint: e.target.value })}
            rows={3}
          />
        </Field>
        <Field label="Present Illness">
          <Textarea
            value={form.presentIllness}
            onChange={(e) => update({ presentIllness: e.target.value })}
            rows={4}
            placeholder="History of present illness..."
          />
        </Field>
      </TabsContent>

      <TabsContent value="findings" className="space-y-4">
        <Field label="Clinical Findings">
          <Textarea
            value={form.clinicalFindings}
            onChange={(e) => update({ clinicalFindings: e.target.value })}
            rows={5}
          />
        </Field>
        <Field label="Additional Notes">
          <Textarea
            value={form.additionalNotes}
            onChange={(e) => update({ additionalNotes: e.target.value })}
            rows={3}
          />
        </Field>
        <Field label="Treatment Recommendation">
          <Textarea
            value={form.treatmentRecommendation}
            onChange={(e) => update({ treatmentRecommendation: e.target.value })}
            rows={3}
          />
        </Field>
      </TabsContent>

      <TabsContent value="diagnosis">
        <Field label="Diagnosis">
          <Textarea
            value={form.diagnosis}
            onChange={(e) => update({ diagnosis: e.target.value })}
            rows={4}
            placeholder="Primary and secondary diagnosis..."
          />
        </Field>
      </TabsContent>

      <TabsContent value="treatment">
        <TreatmentPlanEditor
          name={treatmentPlanName}
          description={treatmentPlanDescription}
          items={treatmentPlanItems}
          onChange={(name, description, items) => {
            onTreatmentPlanChange(name, description, items);
            onMarkUnsaved();
          }}
        />
      </TabsContent>

      <TabsContent value="prescription">
        <PrescriptionBuilder
          visitId=""
          initialMedications={prescriptionMedications}
          generalInstructions={prescriptionInstructions}
          onChange={(meds, instructions) => {
            onPrescriptionChange(meds, instructions);
            onMarkUnsaved();
          }}
          onPrint={onPrintPrescription}
        />
      </TabsContent>

      <TabsContent value="notes" className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {NOTE_TEMPLATES.map((t) => (
            <Button
              key={t.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => update({ clinicalNotes: t.content })}
            >
              {t.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {NOTE_SNIPPETS.map((snippet) => (
            <button
              key={snippet}
              type="button"
              className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
              onClick={() =>
                update({
                  clinicalNotes: form.clinicalNotes
                    ? `${form.clinicalNotes}\n${snippet}`
                    : snippet,
                })
              }
            >
              + {snippet.slice(0, 24)}…
            </button>
          ))}
        </div>
        <Field label="Doctor Notes">
          <Textarea
            value={form.clinicalNotes}
            onChange={(e) => update({ clinicalNotes: e.target.value })}
            rows={10}
            placeholder="Clinical notes, observations, and plan..."
          />
        </Field>
      </TabsContent>

      <TabsContent value="advice">
        <Field label="Patient Advice">
          <Textarea
            value={form.advice}
            onChange={(e) => update({ advice: e.target.value })}
            rows={6}
            placeholder="Post-treatment advice and care instructions..."
          />
        </Field>
      </TabsContent>

      <TabsContent value="followup" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date">
            <Input
              type="date"
              value={form.followUpDate}
              onChange={(e) => update({ followUpDate: e.target.value })}
            />
          </Field>
          <Field label="Time">
            <Input
              type="time"
              value={form.followUpTime}
              onChange={(e) => update({ followUpTime: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Purpose">
          <Input
            value={form.followUpPurpose}
            onChange={(e) => update({ followUpPurpose: e.target.value })}
            placeholder="Review healing, suture removal..."
          />
        </Field>
        <Field label="Reminder">
          <Select
            value={form.followUpReminder ? 'yes' : 'no'}
            onValueChange={(v) => update({ followUpReminder: v === 'yes' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Send reminder</SelectItem>
              <SelectItem value="no">No reminder</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Notes">
          <Textarea
            value={form.followUpNotes}
            onChange={(e) => update({ followUpNotes: e.target.value })}
            rows={3}
          />
        </Field>
      </TabsContent>
    </Tabs>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function consultationFromRecord(
  consultation: ConsultationRecord,
  chiefComplaint: string,
): ConsultationFormState {
  return {
    chiefComplaint: consultation.chiefComplaint ?? chiefComplaint,
    presentIllness: consultation.presentIllness ?? '',
    clinicalFindings: consultation.clinicalFindings ?? '',
    diagnosis: consultation.diagnosis ?? '',
    clinicalNotes: consultation.clinicalNotes ?? '',
    additionalNotes: consultation.additionalNotes ?? '',
    treatmentRecommendation: consultation.treatmentRecommendation ?? '',
    advice: consultation.advice ?? '',
    followUpDate: consultation.followUpDate ?? '',
    followUpTime: consultation.followUpTime ?? '',
    followUpPurpose: consultation.followUpPurpose ?? '',
    followUpReminder: consultation.followUpReminder ?? false,
    followUpNotes: consultation.followUpNotes ?? '',
  };
}

export function formToDraftInput(form: ConsultationFormState) {
  return {
    chiefComplaint: form.chiefComplaint,
    presentIllness: form.presentIllness,
    clinicalFindings: form.clinicalFindings,
    diagnosis: form.diagnosis,
    clinicalNotes: form.clinicalNotes,
    additionalNotes: form.additionalNotes,
    treatmentRecommendation: form.treatmentRecommendation,
    advice: form.advice,
    followUpDate: form.followUpDate || undefined,
    followUpTime: form.followUpTime || undefined,
    followUpPurpose: form.followUpPurpose || undefined,
    followUpReminder: form.followUpReminder,
    followUpNotes: form.followUpNotes || undefined,
  };
}

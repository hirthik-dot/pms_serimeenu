'use client';

import { Plus, Printer, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

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
import { Textarea } from '@/components/ui/textarea';
import { consultationApi } from '@/features/consultation/api/consultation-api';
import type { PrescriptionMedicationDto } from '@/types/consultation';
import type { MedicineSearchResult } from '@/types/consultation';
import {
  MedicationDuration,
  MedicationFrequency,
  MedicineRoute,
} from '@/types/enums';

const FREQUENCY_OPTIONS = Object.values(MedicationFrequency);
const DURATION_UNITS = Object.values(MedicationDuration);

const emptyMedication = (): PrescriptionMedicationDto => ({
  name: '',
  dosage: '',
  frequency: MedicationFrequency.TwiceDaily,
  duration: 5,
  durationUnit: MedicationDuration.Days,
  route: MedicineRoute.Oral,
  morning: false,
  afternoon: false,
  night: false,
  beforeFood: false,
  afterFood: false,
});

interface PrescriptionBuilderProps {
  visitId: string;
  initialMedications?: PrescriptionMedicationDto[];
  generalInstructions?: string;
  onChange: (medications: PrescriptionMedicationDto[], generalInstructions: string) => void;
  onPrint: () => void;
}

export function PrescriptionBuilder({
  initialMedications,
  generalInstructions: initialInstructions = '',
  onChange,
  onPrint,
}: PrescriptionBuilderProps) {
  const [medications, setMedications] = useState<PrescriptionMedicationDto[]>(
    initialMedications?.length ? initialMedications : [emptyMedication()],
  );
  const [generalInstructions, setGeneralInstructions] = useState(initialInstructions);
  const [searchResults, setSearchResults] = useState<MedicineSearchResult[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

  const emitChange = useCallback(
    (meds: PrescriptionMedicationDto[], instructions: string) => {
      onChange(meds, instructions);
    },
    [onChange],
  );

  const updateMedication = (index: number, patch: Partial<PrescriptionMedicationDto>) => {
    const next = medications.map((m, i) => (i === index ? { ...m, ...patch } : m));
    setMedications(next);
    emitChange(next, generalInstructions);
  };

  const addMedication = () => {
    const next = [...medications, emptyMedication()];
    setMedications(next);
    emitChange(next, generalInstructions);
  };

  const removeMedication = (index: number) => {
    const next = medications.filter((_, i) => i !== index);
    const final = next.length ? next : [emptyMedication()];
    setMedications(final);
    emitChange(final, generalInstructions);
  };

  const searchMedicine = async (index: number, q: string) => {
    setActiveSearchIndex(index);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await consultationApi.searchMedicines(q);
    setSearchResults(res.data ?? []);
  };

  const selectMedicine = (index: number, medicine: MedicineSearchResult) => {
    updateMedication(index, {
      medicineId: medicine.id,
      name: medicine.name,
      dosage: medicine.defaultDosage ?? '',
      frequency: medicine.defaultFrequency ?? MedicationFrequency.TwiceDaily,
      route: medicine.defaultRoute ?? MedicineRoute.Oral,
    });
    setSearchResults([]);
    setActiveSearchIndex(null);
  };

  return (
    <div className="space-y-4" id="prescription-print-area">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Prescription Builder</h3>
        <Button type="button" variant="outline" size="sm" onClick={onPrint}>
          <Printer className="mr-1 h-4 w-4" />
          Print
        </Button>
      </div>

      {medications.map((med, index) => (
        <div key={index} className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Medicine {index + 1}</span>
            {medications.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeMedication(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="relative space-y-1">
            <Label>Medicine</Label>
            <Input
              value={med.name}
              onChange={(e) => {
                updateMedication(index, { name: e.target.value });
                void searchMedicine(index, e.target.value);
              }}
              placeholder="Search medicine..."
            />
            {activeSearchIndex === index && searchResults.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-popover shadow-md">
                {searchResults.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => selectMedicine(index, m)}
                    >
                      {m.name}
                      {m.genericName && (
                        <span className="ml-1 text-muted-foreground">({m.genericName})</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Dosage</Label>
              <Input
                value={med.dosage}
                onChange={(e) => updateMedication(index, { dosage: e.target.value })}
                placeholder="e.g. 500mg"
              />
            </div>
            <div className="space-y-1">
              <Label>Frequency</Label>
              <Select
                value={med.frequency}
                onValueChange={(v) => updateMedication(index, { frequency: v as MedicationFrequency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Duration</Label>
              <Input
                type="number"
                min={1}
                value={med.duration}
                onChange={(e) => updateMedication(index, { duration: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Duration Unit</Label>
              <Select
                value={med.durationUnit}
                onValueChange={(v) =>
                  updateMedication(index, { durationUnit: v as MedicationDuration })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <TimingCheckbox
              label="Morning"
              checked={med.morning ?? false}
              onChange={(v) => updateMedication(index, { morning: v })}
            />
            <TimingCheckbox
              label="Afternoon"
              checked={med.afternoon ?? false}
              onChange={(v) => updateMedication(index, { afternoon: v })}
            />
            <TimingCheckbox
              label="Night"
              checked={med.night ?? false}
              onChange={(v) => updateMedication(index, { night: v })}
            />
            <TimingCheckbox
              label="Before Food"
              checked={med.beforeFood ?? false}
              onChange={(v) => updateMedication(index, { beforeFood: v })}
            />
            <TimingCheckbox
              label="After Food"
              checked={med.afterFood ?? false}
              onChange={(v) => updateMedication(index, { afterFood: v })}
            />
          </div>

          <div className="space-y-1">
            <Label>Instructions</Label>
            <Input
              value={med.instructions ?? ''}
              onChange={(e) => updateMedication(index, { instructions: e.target.value })}
              placeholder="Special instructions"
            />
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addMedication}>
        <Plus className="mr-1 h-4 w-4" />
        Add Medicine
      </Button>

      <div className="space-y-1">
        <Label>General Instructions</Label>
        <Textarea
          value={generalInstructions}
          onChange={(e) => {
            setGeneralInstructions(e.target.value);
            emitChange(medications, e.target.value);
          }}
          rows={2}
        />
      </div>
    </div>
  );
}

function TimingCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-input"
      />
      {label}
    </label>
  );
}

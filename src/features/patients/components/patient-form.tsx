'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { BloodGroup, Gender, MaritalStatus, PatientType } from '@/types/enums';
import type { PatientDetail } from '@/types/patient';
import { calculateAge } from '@/utils/date';
import {
  formValuesToCreatePatientInput,
  patientFormSchema,
  type CreatePatientInput,
  type PatientFormInput,
} from '@/validators/patient.validator';

interface PatientFormProps {
  defaultValues?: Partial<PatientDetail> & { phone?: string };
  onSubmit: (data: CreatePatientInput) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  lockPhone?: boolean;
}

const defaultAddress = {
  street: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
};

function collectErrorMessages(errors: FieldErrors<PatientFormInput>, prefix = ''): string[] {
  const messages: string[] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if ('message' in value && typeof value.message === 'string') {
      messages.push(`${path}: ${value.message}`);
    } else if (typeof value === 'object') {
      messages.push(...collectErrorMessages(value as FieldErrors<PatientFormInput>, path));
    }
  }
  return messages;
}

export function PatientForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Register Patient',
  lockPhone = false,
}: PatientFormProps) {
  const form = useForm<PatientFormInput>({
    resolver: zodResolver(patientFormSchema) as never,
    defaultValues: {
      fullName: defaultValues
        ? `${defaultValues.firstName ?? ''} ${defaultValues.lastName ?? ''}`.trim()
        : '',
      dateOfBirth: defaultValues?.dateOfBirth
        ? new Date(defaultValues.dateOfBirth)
        : undefined,
      gender: (defaultValues?.gender as Gender) ?? Gender.Male,
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      address: defaultValues?.address ?? defaultAddress,
      bloodGroup: defaultValues?.bloodGroup as BloodGroup | undefined,
      maritalStatus: defaultValues?.maritalStatus as MaritalStatus | undefined,
      occupation: defaultValues?.occupation ?? '',
      emergencyContact: defaultValues?.emergencyContact ?? {
        name: '',
        relationship: '',
        phone: '',
      },
      allergies: defaultValues?.allergies ?? [],
      notes: defaultValues?.notes ?? '',
      patientType: defaultValues?.patientType ?? PatientType.Adult,
      pediatricInfo: defaultValues?.pediatricInfo ?? {},
      consentGiven: defaultValues?.consentGiven ?? false,
      medicalFlags: {
        diabetes: false,
        hypertension: false,
        heartDisease: false,
        pregnancy: false,
        otherConditions: '',
      },
    },
  });

  const patientType = form.watch('patientType');
  const dob = form.watch('dateOfBirth');
  const age = dob instanceof Date && !Number.isNaN(dob.getTime()) ? calculateAge(dob) : null;

  useEffect(() => {
    if (patientType === PatientType.Adult) {
      form.setValue('pediatricInfo', undefined);
    }
  }, [patientType, form]);

  const handleInvalid = (errors: FieldErrors<PatientFormInput>) => {
    const messages = collectErrorMessages(errors);
    toast.error(messages[0] ?? 'Please complete all required fields');
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(formValuesToCreatePatientInput(values));
  }, handleInvalid);

  const fieldError = (name: keyof PatientFormInput | string) => {
    const parts = String(name).split('.');
    let err: unknown = form.formState.errors;
    for (const part of parts) {
      err = (err as Record<string, unknown>)?.[part];
    }
    return err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={patientType}
            onValueChange={(v) => form.setValue('patientType', v as PatientType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PatientType.Adult}>Adult Patient</SelectItem>
              <SelectItem value={PatientType.Pediatric}>Pediatric Patient</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" {...form.register('fullName')} placeholder="First Last" />
            {fieldError('fullName') ? (
              <p className="text-sm text-destructive">{fieldError('fullName')}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...form.register('dateOfBirth', { valueAsDate: true })}
            />
            {fieldError('dateOfBirth') ? (
              <p className="text-sm text-destructive">{fieldError('dateOfBirth')}</p>
            ) : null}
            {age !== null ? (
              <p className="text-xs text-muted-foreground">Age: {age} years</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Gender *</Label>
            <Select
              value={form.watch('gender')}
              onValueChange={(v) => form.setValue('gender', v as Gender)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Gender).map((g) => (
                  <SelectItem key={g} value={g} className="capitalize">
                    {g.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              {...form.register('phone')}
              disabled={lockPhone}
              placeholder="9876543210"
            />
            {fieldError('phone') ? (
              <p className="text-sm text-destructive">{fieldError('phone')}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register('email')} />
            {fieldError('email') ? (
              <p className="text-sm text-destructive">{fieldError('email')}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Blood Group</Label>
            <Select
              value={form.watch('bloodGroup') ?? ''}
              onValueChange={(v) => form.setValue('bloodGroup', v as BloodGroup)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(BloodGroup).map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Marital Status</Label>
            <Select
              value={form.watch('maritalStatus') ?? ''}
              onValueChange={(v) => form.setValue('maritalStatus', v as MaritalStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MaritalStatus).map((ms) => (
                  <SelectItem key={ms} value={ms} className="capitalize">
                    {ms}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input id="occupation" {...form.register('occupation')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address *</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="street">Street</Label>
            <Input id="street" {...form.register('address.street')} />
            {fieldError('address.street') ? (
              <p className="text-sm text-destructive">{fieldError('address.street')}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...form.register('address.city')} />
            {fieldError('address.city') ? (
              <p className="text-sm text-destructive">{fieldError('address.city')}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" {...form.register('address.state')} />
            {fieldError('address.state') ? (
              <p className="text-sm text-destructive">{fieldError('address.state')}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode (6 digits)</Label>
            <Input id="pincode" {...form.register('address.pincode')} placeholder="400001" />
            {fieldError('address.pincode') ? (
              <p className="text-sm text-destructive">{fieldError('address.pincode')}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...form.register('address.country')} />
          </div>
        </CardContent>
      </Card>

      {patientType === PatientType.Pediatric ? (
        <Card>
          <CardHeader>
            <CardTitle>Pediatric Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent Name *</Label>
              <Input id="parentName" {...form.register('pediatricInfo.parentName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input id="guardianName" {...form.register('pediatricInfo.guardianName')} />
              {fieldError('pediatricInfo.guardianName') ? (
                <p className="text-sm text-destructive">{fieldError('pediatricInfo.guardianName')}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input id="schoolName" {...form.register('pediatricInfo.schoolName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pediatrician">Pediatrician</Label>
              <Input id="pediatrician" {...form.register('pediatricInfo.pediatrician')} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact (optional)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="ecName">Name</Label>
            <Input id="ecName" {...form.register('emergencyContact.name')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ecRelationship">Relationship</Label>
            <Input id="ecRelationship" {...form.register('emergencyContact.relationship')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ecPhone">Phone</Label>
            <Input id="ecPhone" {...form.register('emergencyContact.phone')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {(['diabetes', 'hypertension', 'heartDisease', 'pregnancy'] as const).map((flag) => (
              <label key={flag} className="flex items-center gap-2 text-sm capitalize">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  {...form.register(`medicalFlags.${flag}`)}
                />
                {flag.replace(/([A-Z])/g, ' $1').trim()}
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies (comma-separated)</Label>
            <Input
              id="allergies"
              placeholder="Penicillin, Latex"
              onChange={(e) => {
                const items = e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
                form.setValue('allergies', items);
              }}
              defaultValue={(defaultValues?.allergies ?? []).join(', ')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chiefComplaint">Chief Complaint / Notes</Label>
            <Textarea id="chiefComplaint" {...form.register('notes')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input"
              {...form.register('consentGiven')}
            />
            <span className="text-sm">
              I consent to treatment and authorize the clinic to store my medical information
              in accordance with privacy regulations. *
            </span>
          </label>
          {fieldError('consentGiven') ? (
            <p className="mt-2 text-sm text-destructive">{fieldError('consentGiven')}</p>
          ) : null}
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            Saving...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}

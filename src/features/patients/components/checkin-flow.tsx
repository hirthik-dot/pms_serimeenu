'use client';

import { Loader2, Phone, QrCode } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { checkinApi } from '@/features/patients/api/patient-api';
import { CheckinQrCode } from '@/features/patients/components/checkin-qr-code';
import { PatientForm } from '@/features/patients/components/patient-form';
import { PatientType } from '@/types/enums';
import type { PatientDetail } from '@/types/patient';
import type { CreatePatientInput } from '@/validators/patient.validator';

type Step = 'phone' | 'returning' | 'new' | 'success';

export function CheckinFlow() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [currentIssue, setCurrentIssue] = useState('');
  const [tokenResult, setTokenResult] = useState<{ tokenNumber: number; hospitalId: string } | null>(
    null,
  );

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await checkinApi.lookup(phone);
      if (response.data.found && response.data.patient) {
        setPatient(response.data.patient);
        setStep('returning');
      } else {
        setStep('new');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lookup failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReturningSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    setIsLoading(true);
    try {
      const response = await checkinApi.submit({
        mode: 'returning',
        phone,
        chiefComplaint,
        currentIssue: currentIssue || undefined,
      });
      setTokenResult({
        tokenNumber: response.data.tokenNumber,
        hospitalId: response.data.hospitalId,
      });
      setStep('success');
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleNewPatientSubmit(data: CreatePatientInput) {
    setIsLoading(true);
    try {
      const response = await checkinApi.submit({
        mode: 'new',
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        email: data.email,
        address: data.address,
        bloodGroup: data.bloodGroup,
        maritalStatus: data.maritalStatus,
        occupation: data.occupation,
        emergencyContact: data.emergencyContact,
        allergies: data.allergies ?? [],
        patientType: data.patientType,
        pediatricInfo: data.pediatricInfo,
        consentGiven: data.consentGiven,
        medicalFlags: data.medicalFlags,
        chiefComplaint: data.notes?.trim() || 'New patient registration',
      });
      setTokenResult({
        tokenNumber: response.data.tokenNumber,
        hospitalId: response.data.hospitalId,
      });
      setStep('success');
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  function resetFlow() {
    setStep('phone');
    setPhone('');
    setPatient(null);
    setChiefComplaint('');
    setCurrentIssue('');
    setTokenResult(null);
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <QrCode className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold">Patient Check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan the QR code at reception or enter your mobile number
        </p>
        <div className="mt-4 flex justify-center">
          <CheckinQrCode size={160} />
        </div>
      </div>

      {step === 'phone' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Enter Mobile Number
            </CardTitle>
            <CardDescription>We will look up your registration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  minLength={10}
                  maxLength={10}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || phone.length < 10}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Search Patient'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {step === 'returning' && patient ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {patient.fullName}</CardTitle>
            <CardDescription>
              {patient.patientId} · Age {patient.age} · {patient.gender}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Address:</span>{' '}
                {patient.address.street}, {patient.address.city}
              </p>
              {patient.email ? (
                <p>
                  <span className="text-muted-foreground">Email:</span> {patient.email}
                </p>
              ) : null}
              {patient.emergencyContact ? (
                <p>
                  <span className="text-muted-foreground">Emergency:</span>{' '}
                  {patient.emergencyContact.name} ({patient.emergencyContact.phone})
                </p>
              ) : null}
            </div>
            <form onSubmit={handleReturningSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                <Textarea
                  id="chiefComplaint"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  required
                  placeholder="Describe your reason for visit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentIssue">Current Issue</Label>
                <Textarea
                  id="currentIssue"
                  value={currentIssue}
                  onChange={(e) => setCurrentIssue(e.target.value)}
                  placeholder="Any additional details"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={resetFlow}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Submit & Get Token'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {step === 'new' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Patient Registration</CardTitle>
              <CardDescription>Phone: {phone} — Complete your registration form</CardDescription>
            </CardHeader>
          </Card>
          <PatientForm
            onSubmit={handleNewPatientSubmit}
            isSubmitting={isLoading}
            submitLabel="Register & Check In"
            defaultValues={{ phone, patientType: PatientType.Adult }}
            lockPhone
          />
          <Button variant="outline" onClick={resetFlow}>
            Back
          </Button>
        </div>
      ) : null}

      {step === 'success' && tokenResult ? (
        <Card className="border-success/30">
          <CardHeader className="text-center">
            <CardTitle className="text-success">Check-in Successful</CardTitle>
            <CardDescription>Please proceed to the waiting area</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="mx-auto rounded-xl bg-primary/5 p-8">
              <p className="text-sm text-muted-foreground">Your Token Number</p>
              <p className="text-5xl font-bold text-primary">{tokenResult.tokenNumber}</p>
              <p className="mt-2 font-mono text-sm">{tokenResult.hospitalId}</p>
            </div>
            <Button onClick={resetFlow} className="w-full">
              Done
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

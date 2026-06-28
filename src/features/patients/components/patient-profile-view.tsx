'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Edit,
  Loader2,
  Merge,
  Printer,
  QrCode,
  RotateCcw,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { PermissionGate } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { patientApi } from '@/features/patients/api/patient-api';
import { PatientStatusBadge } from '@/features/patients/components/patient-status-badge';
import { PatientTimeline } from '@/features/patients/components/patient-timeline';
import { ApiClientError } from '@/lib/api-client';
import { formatDate } from '@/utils/date';

interface PatientProfileViewProps {
  patientId: string;
}

export function PatientProfileView({ patientId }: PatientProfileViewProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mergeId, setMergeId] = useState('');
  const [showMerge, setShowMerge] = useState(false);

  const { data: patientResponse, isLoading } = useQuery({
    queryKey: ['patients', patientId],
    queryFn: () => patientApi.get(patientId),
  });

  const { data: timelineResponse, isLoading: timelineLoading } = useQuery({
    queryKey: ['patients', patientId, 'timeline'],
    queryFn: () => patientApi.getTimeline(patientId, { limit: 50 }),
  });

  const { data: historyResponse } = useQuery({
    queryKey: ['patients', patientId, 'history'],
    queryFn: () => patientApi.getHistory(patientId),
  });

  const { data: documentsResponse } = useQuery({
    queryKey: ['patients', patientId, 'documents'],
    queryFn: () => patientApi.getDocuments(patientId),
  });

  const patient = patientResponse?.data;

  const archiveMutation = useMutation({
    mutationFn: () => patientApi.archive(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient archived');
    },
    onError: (e: Error) => toast.error(e instanceof ApiClientError ? e.message : 'Failed'),
  });

  const restoreMutation = useMutation({
    mutationFn: () => patientApi.restore(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient restored');
    },
    onError: (e: Error) => toast.error(e instanceof ApiClientError ? e.message : 'Failed'),
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => patientApi.uploadProfilePhoto(patientId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients', patientId] });
      toast.success('Photo updated');
    },
    onError: (e: Error) => toast.error(e instanceof ApiClientError ? e.message : 'Upload failed'),
  });

  const mergeMutation = useMutation({
    mutationFn: (duplicateId: string) => patientApi.merge(patientId, duplicateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patients merged');
      setShowMerge(false);
    },
    onError: (e: Error) => toast.error(e instanceof ApiClientError ? e.message : 'Merge failed'),
  });

  if (isLoading || !patient) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = `${patient.firstName[0]}${patient.lastName[0]}`.toUpperCase();
  const history = historyResponse?.data as Record<string, unknown[]> | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={patient.fullName}
        description={`${patient.patientId} · ${patient.phone} · Age ${patient.age}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission="patients:update">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/patients/${patientId}/edit`}>
                  <Edit />
                  Edit
                </Link>
              </Button>
            </PermissionGate>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer />
              Print
            </Button>
            <Button variant="outline" size="sm" disabled title="QR card generation">
              <QrCode />
              QR Card
            </Button>
            <PermissionGate permission="patients:update">
              {patient.status === 'archived' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restoreMutation.mutate()}
                  disabled={restoreMutation.isPending}
                >
                  <RotateCcw />
                  Restore
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => archiveMutation.mutate()}
                  disabled={archiveMutation.isPending}
                >
                  <Archive />
                  Archive
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowMerge((s) => !s)}>
                <Merge />
                Merge
              </Button>
            </PermissionGate>
          </div>
        }
      />

      {showMerge ? (
        <Card>
          <CardHeader>
            <CardTitle>Merge Duplicate Patient</CardTitle>
            <CardDescription>
              Enter the duplicate patient ID to merge into this record
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <input
              className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
              placeholder="Duplicate patient ObjectId"
              value={mergeId}
              onChange={(e) => setMergeId(e.target.value)}
            />
            <Button
              onClick={() => mergeMutation.mutate(mergeId)}
              disabled={!mergeId || mergeMutation.isPending}
            >
              Merge
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <Avatar className="h-24 w-24">
              {patient.profileImage ? (
                <AvatarImage src={patient.profileImage} alt={patient.fullName} />
              ) : null}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) photoMutation.mutate(file);
              }}
            />
            <PermissionGate permission="patients:update">
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoMutation.isPending}
              >
                <Upload />
                Update photo
              </Button>
            </PermissionGate>
            <div className="mt-4 space-y-2">
              <PatientStatusBadge status={patient.status} />
              <p className="text-sm capitalize text-muted-foreground">
                {patient.patientType} · {patient.gender.replace(/_/g, ' ')}
              </p>
              {patient.outstandingDue > 0 ? (
                <p className="text-sm font-medium text-destructive">
                  Outstanding: ₹{patient.outstandingDue.toLocaleString('en-IN')}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{formatDate(patient.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{patient.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Blood Group</p>
              <p className="font-medium">{patient.bloodGroup ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Occupation</p>
              <p className="font-medium">{patient.occupation ?? '—'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">
                {patient.address.street}, {patient.address.city}, {patient.address.state}{' '}
                {patient.address.pincode}
              </p>
            </div>
            {patient.emergencyContact ? (
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Emergency Contact</p>
                <p className="font-medium">
                  {patient.emergencyContact.name} ({patient.emergencyContact.relationship}) —{' '}
                  {patient.emergencyContact.phone}
                </p>
              </div>
            ) : null}
            {patient.pediatricInfo?.schoolName ? (
              <div>
                <p className="text-muted-foreground">School</p>
                <p className="font-medium">{patient.pediatricInfo.schoolName}</p>
              </div>
            ) : null}
            {patient.pediatricInfo?.guardianName ? (
              <div>
                <p className="text-muted-foreground">Guardian</p>
                <p className="font-medium">{patient.pediatricInfo.guardianName}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Medical History</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="xrays">X-rays</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {patient.medicalHistory?.conditions?.length ? (
                <div>
                  <p className="font-medium text-muted-foreground">Conditions</p>
                  <ul className="mt-1 list-inside list-disc">
                    {patient.medicalHistory.conditions.map((c, i) => (
                      <li key={i}>{c.name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {patient.allergies.length ? (
                <div>
                  <p className="font-medium text-muted-foreground">Allergies</p>
                  <p>{patient.allergies.join(', ')}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No allergies recorded.</p>
              )}
              {patient.medicalHistory?.currentMedications?.length ? (
                <div>
                  <p className="font-medium text-muted-foreground">Current Medications</p>
                  <p>{patient.medicalHistory.currentMedications.join(', ')}</p>
                </div>
              ) : null}
              {patient.medicalHistory?.notes ? (
                <div>
                  <p className="font-medium text-muted-foreground">Notes</p>
                  <p>{patient.medicalHistory.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <PatientTimeline
                entries={timelineResponse?.data ?? []}
                isLoading={timelineLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle>Visit History</CardTitle>
            </CardHeader>
            <CardContent>
              {(history?.visits as unknown[])?.length ? (
                <p className="text-sm text-muted-foreground">
                  {(history?.visits as unknown[]).length} visit(s) on record
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No visits recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Card>
            <CardHeader>
              <CardTitle>Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {(history?.prescriptions as unknown[])?.length ? (
                <p className="text-sm text-muted-foreground">
                  {(history?.prescriptions as unknown[]).length} prescription(s) on record
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No prescriptions recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {(documentsResponse?.data as unknown[])?.length ? (
                <ul className="space-y-2 text-sm">
                  {(documentsResponse?.data as Array<{ originalName: string; url: string }>).map(
                    (doc, i) => (
                      <li key={i}>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {doc.originalName}
                        </a>
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="xrays">
          <Card>
            <CardHeader>
              <CardTitle>X-rays</CardTitle>
            </CardHeader>
            <CardContent>
              {(history?.xrays as unknown[])?.length ? (
                <p className="text-sm text-muted-foreground">
                  {(history?.xrays as unknown[]).length} X-ray(s) on record
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No X-rays uploaded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

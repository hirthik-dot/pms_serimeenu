'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Download, Loader2, Printer, Search } from 'lucide-react';
import { Fragment, useState } from 'react';

import { AuthGuard, PermissionGate } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  reportsApi,
  type PatientRecordDetail,
  type PatientRecordSummary,
} from '@/features/reports/api/reports-api';
import {
  PatientRecordPrint,
  PrescriptionPrint,
} from '@/features/reports/components/patient-record-print';
import { LIVE_QUERY_OPTIONS } from '@/constants/query';
import { formatDate } from '@/utils/date';
import { exportToExcel } from '@/utils/excel';

const REFERRAL_LABELS: Record<string, string> = {
  doctor: 'Doctor',
  ads: 'Ads',
  friend: 'Friend',
  social_media: 'Social Media',
  walk_in: 'Walk-in',
  website: 'Website',
  other: 'Other',
};

function PatientRecordDetailPanel({
  record,
  onPrintRecord,
  onPrintPrescription,
}: {
  record: PatientRecordDetail;
  onPrintRecord: () => void;
  onPrintPrescription: (id: string) => void;
}) {
  const { patient, bills, prescriptions } = record;

  return (
    <div className="space-y-4 border-t bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{patient.fullName}</h3>
          <p className="text-sm text-muted-foreground">
            {patient.patientId} · Age {patient.age} · {patient.gender.replace(/_/g, ' ')}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onPrintRecord}>
          <Printer className="mr-1 h-4 w-4" />
          Print Full Record
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Patient Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><strong>DOB:</strong> {formatDate(patient.dateOfBirth)}</p>
            <p><strong>Phone:</strong> {patient.phone || 'N/A'}</p>
            <p><strong>Email:</strong> {patient.email || 'N/A'}</p>
            <p>
              <strong>Referred By:</strong>{' '}
              {patient.referredBy ? REFERRAL_LABELS[patient.referredBy] ?? patient.referredBy : 'N/A'}
            </p>
            <p>
              <strong>Address:</strong>{' '}
              {[patient.address.street, patient.address.city, patient.address.state, patient.address.pincode]
                .filter((v) => v && v !== '-')
                .join(', ') || 'N/A'}
            </p>
            <p><strong>Chief Complaint:</strong> {patient.notes || 'N/A'}</p>
            {patient.allergies.length > 0 ? (
              <p><strong>Allergies:</strong> {patient.allergies.join(', ')}</p>
            ) : null}
            {patient.bloodGroup ? <p><strong>Blood Group:</strong> {patient.bloodGroup}</p> : null}
            {patient.occupation ? <p><strong>Occupation:</strong> {patient.occupation}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {patient.emergencyContact ? (
              <div className="space-y-1">
                <p><strong>Name:</strong> {patient.emergencyContact.name}</p>
                <p><strong>Relationship:</strong> {patient.emergencyContact.relationship}</p>
                <p><strong>Phone:</strong> {patient.emergencyContact.phone}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Not provided</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Prescriptions ({prescriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No prescriptions on record</p>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="rounded border p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {formatDate(rx.date)} — {rx.doctorName}
                      </p>
                      <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                        {rx.medications.map((med, i) => (
                          <li key={i}>
                            {med.name} — {med.dosage}, {med.frequency.replace(/_/g, ' ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onPrintPrescription(rx.id)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Bills ({bills.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bills on record</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.billNumber}</TableCell>
                    <TableCell>{formatDate(bill.createdAt)}</TableCell>
                    <TableCell>₹{bill.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>₹{bill.paidAmount.toLocaleString()}</TableCell>
                    <TableCell>₹{bill.balanceAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {bill.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function Reports() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printPrescriptionId, setPrintPrescriptionId] = useState<string | null>(null);
  const limit = 25;

  const { data: response, isLoading } = useQuery({
    queryKey: ['reports-patient-records', page, search],
    queryFn: () => reportsApi.getPatientRecords(page, limit, search || undefined),
    ...LIVE_QUERY_OPTIONS,
  });

  const { data: detailResponse, isLoading: detailLoading } = useQuery({
    queryKey: ['reports-patient-record-detail', expandedId],
    queryFn: () => reportsApi.getPatientRecordDetail(expandedId!),
    enabled: !!expandedId,
    ...LIVE_QUERY_OPTIONS,
  });

  const records = response?.data?.data ?? [];
  const total = response?.data?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;
  const detail = detailResponse?.data;

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
    setExpandedId(null);
  };

  const handleExport = () => {
    const exportData = records.map((r: PatientRecordSummary) => ({
      'Patient ID': r.patientId,
      Name: r.fullName,
      Phone: r.phone || 'N/A',
      DOB: formatDate(r.dateOfBirth),
      Gender: r.gender,
      'Referred By': r.referredBy ? REFERRAL_LABELS[r.referredBy] ?? r.referredBy : 'N/A',
      'Chief Complaint': r.notes || 'N/A',
      Status: r.status,
      Registered: formatDate(r.createdAt),
    }));
    exportToExcel(exportData, 'Patient Records', `Patient_Records_${formatDate(new Date().toISOString())}`);
  };

  const handlePrintRecord = () => {
    setPrintPrescriptionId(null);
    document.body.classList.add('print-report');
    window.print();
    document.body.classList.remove('print-report');
  };

  const handlePrintPrescription = (prescriptionId: string) => {
    setPrintPrescriptionId(prescriptionId);
    requestAnimationFrame(() => {
      document.body.classList.add('print-report');
      window.print();
      document.body.classList.remove('print-report');
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const printPrescription = detail?.prescriptions.find((rx) => rx.id === printPrescriptionId);

  return (
    <>
      <div className="space-y-6 print-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Patient Reports"
          description="Full patient records with prescriptions, bills, and print options."
        />
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, ID, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button type="button" onClick={handleSearch}>Search</Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Patient ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Referred By</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="inline-block h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No patient records found.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record: PatientRecordSummary) => (
                <Fragment key={record.id}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpand(record.id)}
                  >
                    <TableCell>
                      {expandedId === record.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell>{record.patientId}</TableCell>
                    <TableCell className="font-medium">{record.fullName}</TableCell>
                    <TableCell>{record.phone || '—'}</TableCell>
                    <TableCell>
                      {record.referredBy ? REFERRAL_LABELS[record.referredBy] ?? record.referredBy : '—'}
                    </TableCell>
                    <TableCell>{formatDate(record.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{record.status}</Badge>
                    </TableCell>
                  </TableRow>
                  {expandedId === record.id ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        {detailLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : detail ? (
                          <PatientRecordDetailPanel
                            record={detail}
                            onPrintRecord={handlePrintRecord}
                            onPrintPrescription={handlePrintPrescription}
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} records)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
      </div>

      {detail ? (
        <>
          <PatientRecordPrint
            patient={detail.patient}
            bills={detail.bills}
            prescriptions={detail.prescriptions}
          />
          {printPrescription && detail ? (
            <PrescriptionPrint prescription={printPrescription} patient={detail.patient} />
          ) : null}
        </>
      ) : null}
    </>
  );
}

export function ReportsPage() {
  return (
    <AuthGuard>
      <PermissionGate permission="reports:read">
        <Reports />
      </PermissionGate>
    </AuthGuard>
  );
}

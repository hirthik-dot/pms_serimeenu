'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { AuthGuard, PermissionGate } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reportsApi } from '@/features/reports/api/reports-api';
import { formatDate } from '@/utils/date';
import { exportToExcel } from '@/utils/excel';

interface VisitReportRow {
  id?: string;
  _id?: string;
  date: string;
  status: string;
  chiefComplaint?: string;
  patientId?: {
    patientId?: string;
    firstName?: string;
    lastName?: string;
  };
  doctorId?: {
    firstName?: string;
    lastName?: string;
  };
}

export function Reports() {
  const [page] = useState(1);
  const limit = 50;

  const { data: response, isLoading } = useQuery({
    queryKey: ['reports-visits', page],
    queryFn: () => reportsApi.getVisits(page, limit),
  });

  const handleExport = () => {
    if (!response?.data?.data) return;

    const exportData = (response.data.data as unknown as VisitReportRow[]).map((visit) => ({
      'Date': formatDate(visit.date),
      'Patient ID': visit.patientId?.patientId || 'N/A',
      'Patient Name': `${visit.patientId?.firstName || ''} ${visit.patientId?.lastName || ''}`,
      'Doctor': `${visit.doctorId?.firstName || ''} ${visit.doctorId?.lastName || ''}`,
      'Status': visit.status,
      'Chief Complaint': visit.chiefComplaint || 'N/A',
    }));

    exportToExcel(exportData, 'Reports', `Reports_Export_${formatDate(new Date().toISOString())}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Detailed Reports"
          description="View and export all detailed visit records."
        />
        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Current Page
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient ID</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="inline-block h-6 w-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : (response?.data?.data as unknown as VisitReportRow[] | undefined)?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              (response?.data?.data as unknown as VisitReportRow[] | undefined)?.map((visit) => (
                <TableRow key={visit.id || visit._id}>
                  <TableCell>{formatDate(visit.date)}</TableCell>
                  <TableCell>{visit.patientId?.patientId}</TableCell>
                  <TableCell>
                    {visit.patientId?.firstName} {visit.patientId?.lastName}
                  </TableCell>
                  <TableCell>
                    Dr. {visit.doctorId?.firstName} {visit.doctorId?.lastName}
                  </TableCell>
                  <TableCell>{visit.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
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

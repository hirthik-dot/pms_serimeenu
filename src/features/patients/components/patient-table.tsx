'use client';

import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PatientStatusBadge } from '@/features/patients/components/patient-status-badge';
import type { PatientSummary } from '@/types/patient';
import { formatDate } from '@/utils/date';

interface PatientTableProps {
  patients: PatientSummary[];
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
}

export function PatientTable({ patients, onArchive, onRestore }: PatientTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hospital ID</TableHead>
            <TableHead>Patient Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Last Visit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Outstanding Due</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                No patients found.
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  <span className="font-mono text-sm">{patient.patientId}</span>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/patients/${patient.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {patient.fullName}
                  </Link>
                </TableCell>
                <TableCell>{patient.phone}</TableCell>
                <TableCell>{patient.age}</TableCell>
                <TableCell className="capitalize">
                  {patient.gender.replace(/_/g, ' ')}
                </TableCell>
                <TableCell>
                  {patient.lastVisit ? formatDate(patient.lastVisit) : '—'}
                </TableCell>
                <TableCell>
                  <PatientStatusBadge status={patient.status} />
                </TableCell>
                <TableCell>
                  {patient.outstandingDue > 0 ? (
                    <span className="font-medium text-destructive">
                      ₹{patient.outstandingDue.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/patients/${patient.id}`}>View profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/patients/${patient.id}/edit`}>Edit</Link>
                      </DropdownMenuItem>
                      {patient.status === 'archived' && onRestore ? (
                        <DropdownMenuItem onClick={() => onRestore(patient.id)}>
                          Restore
                        </DropdownMenuItem>
                      ) : onArchive ? (
                        <DropdownMenuItem onClick={() => onArchive(patient.id)}>
                          Archive
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

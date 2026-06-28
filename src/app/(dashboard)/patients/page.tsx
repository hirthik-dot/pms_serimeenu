'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Loader2, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import { AuthGuard } from '@/components/auth/auth-guard';
import { PermissionGate } from '@/components/auth/auth-guard';
import { PageHeader } from '@/components/shared/page-header';
import { DataTableSkeleton } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { patientApi } from '@/features/patients/api/patient-api';
import { PatientTable } from '@/features/patients/components/patient-table';
import { usePagination } from '@/hooks/use-pagination';
import { ApiClientError } from '@/lib/api-client';
import { PatientStatus } from '@/types/enums';

export default function PatientsPage() {
  const queryClient = useQueryClient();
  const { page, limit, setPage } = usePagination();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, limit, search, statusFilter],
    queryFn: () =>
      patientApi.list({
        page,
        limit,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  const archiveMutation = useMutation({
    mutationFn: patientApi.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient archived');
    },
    onError: (e: Error) => toast.error(e instanceof ApiClientError ? e.message : 'Failed'),
  });

  const restoreMutation = useMutation({
    mutationFn: patientApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient restored');
    },
    onError: (e: Error) => toast.error(e instanceof ApiClientError ? e.message : 'Failed'),
  });

  async function handleExport() {
    try {
      const response = await patientApi.exportCsv({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'patients-export.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  }

  const patients = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader
          title="Patients"
          description="Manage patient records, registration, and clinical history"
          actions={
            <div className="flex gap-2">
              <PermissionGate permission="export:read">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download />
                  Export
                </Button>
              </PermissionGate>
              <PermissionGate permission="patients:create">
                <Button size="sm" asChild>
                  <Link href="/patients/new">
                    <Plus />
                    New Patient
                  </Link>
                </Button>
              </PermissionGate>
            </div>
          }
        />

        <div className="flex flex-col gap-4 sm:flex-row">
          <form
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput);
              setPage(1);
            }}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, phone, hospital ID, guardian, school..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.values(PatientStatus).map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <DataTableSkeleton />
        ) : (
          <PatientTable
            patients={patients}
            onArchive={(id) => archiveMutation.mutate(id)}
            onRestore={(id) => restoreMutation.mutate(id)}
          />
        )}

        {totalPages > 1 ? (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const p = i + 1;
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p);
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}

        {archiveMutation.isPending || restoreMutation.isPending ? (
          <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-card px-4 py-2 shadow-lg border">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Updating...</span>
          </div>
        ) : null}
      </div>
    </AuthGuard>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, IndianRupee, Loader2, Printer, Receipt, Search, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AuthGuard, PermissionGate } from '@/components/auth/auth-guard';
import { useAuth } from '@/providers/auth-provider';
import { hasAnyPermission } from '@/services/auth/permission.service';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LIVE_QUERY_OPTIONS } from '@/constants/query';
import { BillInvoicePrint, type InvoiceData } from '@/features/billing/components/bill-invoice-print';
import { ApiClientError, apiFetchWithRefresh } from '@/lib/api-client';
import type { BillDto, PaymentDto } from '@/services/bill.service';
import { BillStatus, PaymentMethod } from '@/types/enums';
import { formatDate } from '@/utils/date';

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof CreditCard;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-8 w-8 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canCollectPayment = user
    ? hasAnyPermission(user.permissions, ['payments:create', 'billing:create', 'billing:update'])
    : false;
  const [selectedBill, setSelectedBill] = useState<BillDto | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [payRef, setPayRef] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [printInvoice, setPrintInvoice] = useState<InvoiceData | null>(null);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: '50',
    sortOrder: 'desc',
  });
  if (search) queryParams.set('search', search);
  if (statusFilter !== 'all') queryParams.set('status', statusFilter);
  if (dateFrom) queryParams.set('dateFrom', dateFrom);
  if (dateTo) queryParams.set('dateTo', dateTo);

  const { data: billsRes, isLoading } = useQuery({
    queryKey: ['bills', page, search, statusFilter, dateFrom, dateTo],
    queryFn: () =>
      apiFetchWithRefresh<{ data: BillDto[]; total: number; page: number; limit: number }>(
        `/bills?${queryParams.toString()}`,
      ),
    ...LIVE_QUERY_OPTIONS,
  });

  const { data: outstandingRes } = useQuery({
    queryKey: ['bills', 'outstanding'],
    queryFn: () =>
      apiFetchWithRefresh<{ data: BillDto[]; total: number }>('/bills/outstanding?limit=20'),
    ...LIVE_QUERY_OPTIONS,
  });

  const bills = billsRes?.data?.data ?? [];
  const total = billsRes?.data?.total ?? 0;
  const totalPages = Math.ceil(total / 50) || 1;
  const outstanding = outstandingRes?.data?.data ?? [];
  const totalOutstanding = outstanding.reduce((s, b) => s + b.balanceAmount, 0);

  const invalidateBilling = () => {
    void queryClient.invalidateQueries({ queryKey: ['bills'] });
  };

  const paymentMutation = useMutation({
    mutationFn: (payload: {
      billId: string;
      amount: number;
      method: PaymentMethod;
      referenceNumber?: string;
    }) =>
      apiFetchWithRefresh<PaymentDto>('/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Payment recorded');
      setPayAmount('');
      setPayRef('');
      setSelectedBill(null);
      invalidateBilling();
    },
    onError: (error: Error) => {
      toast.error(error instanceof ApiClientError ? error.message : 'Payment failed');
    },
  });

  useEffect(() => {
    if (!printInvoice) return;

    const timer = window.setTimeout(() => window.print(), 100);
    const clearAfterPrint = () => setPrintInvoice(null);

    window.addEventListener('afterprint', clearAfterPrint);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', clearAfterPrint);
    };
  }, [printInvoice]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const selectBillForPayment = (bill: BillDto) => {
    if (!canCollectPayment) {
      toast.error('You do not have permission to record payments');
      return;
    }
    setSelectedBill(bill);
    setPayAmount(String(bill.balanceAmount));
  };

  const recordPayment = () => {
    if (!selectedBill) return;
    const amount = Number.parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (
      [PaymentMethod.Card, PaymentMethod.UPI, PaymentMethod.BankTransfer].includes(payMethod) &&
      !payRef.trim()
    ) {
      toast.error('Reference number is required for this payment method');
      return;
    }
    paymentMutation.mutate({
      billId: selectedBill.id,
      amount,
      method: payMethod,
      referenceNumber: payRef.trim() || undefined,
    });
  };

  const handlePrintBill = async (bill: BillDto) => {
    try {
      const res = await apiFetchWithRefresh<InvoiceData>(`/bills/${bill.id}/invoice`);
      setPrintInvoice(res.data);
    } catch (error) {
      toast.error(
        error instanceof ApiClientError ? error.message : 'Failed to load invoice for printing',
      );
    }
  };

  return (
    <AuthGuard>
      <>
        <div className="space-y-6 print-hidden">
          <PageHeader title="Billing" description="Bill records, search, payments, and printable invoices" />

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Total Bills" value={String(total)} icon={Receipt} />
            <StatCard title="Outstanding" value={`₹${totalOutstanding.toLocaleString()}`} icon={IndianRupee} />
            <StatCard title="Pending" value={String(outstanding.length)} icon={TrendingUp} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Search & Filter Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Bill number or patient name..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(BillStatus).map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
                <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
              </div>
              <Button type="button" className="mt-3" variant="outline" onClick={handleSearch}>
                Apply Search
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Bill Records</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bill #</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            <Loader2 className="inline-block h-6 w-6 animate-spin text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : bills.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                            No bills found
                          </TableCell>
                        </TableRow>
                      ) : (
                        bills.map((bill) => (
                          <TableRow
                            key={bill.id}
                            className={`cursor-pointer ${selectedBill?.id === bill.id ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                            onClick={() => selectBillForPayment(bill)}
                          >
                            <TableCell className="font-medium">{bill.billNumber}</TableCell>
                            <TableCell>{bill.patientName}</TableCell>
                            <TableCell>{formatDate(bill.createdAt)}</TableCell>
                            <TableCell className="text-right">₹{bill.totalAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{bill.paidAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{bill.balanceAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {bill.status.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handlePrintBill(bill);
                                  }}
                                  title="Print bill"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                {bill.balanceAmount > 0 ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectBillForPayment(bill);
                                    }}
                                    title="Collect payment"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 ? (
                  <div className="flex items-center justify-between border-t p-4">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
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
              </CardContent>
            </Card>

            <PermissionGate
              permission={['payments:create', 'billing:create', 'billing:update']}
              fallback={
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Collect Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      You do not have permission to record payments. Log out and log back in if
                      your role was recently updated.
                    </p>
                  </CardContent>
                </Card>
              }
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Collect Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedBill ? (
                    selectedBill.balanceAmount <= 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Bill <strong>{selectedBill.billNumber}</strong> is fully paid.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm">
                          Bill <strong>{selectedBill.billNumber}</strong> — Balance ₹
                          {selectedBill.balanceAmount.toLocaleString()}
                        </p>
                        <div className="space-y-1">
                          <Label>Amount</Label>
                          <Input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Method</Label>
                          <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(PaymentMethod).map((m) => (
                                <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Reference</Label>
                          <Input
                            value={payRef}
                            onChange={(e) => setPayRef(e.target.value)}
                            placeholder={
                              payMethod === PaymentMethod.Cash || payMethod === PaymentMethod.Cheque
                                ? 'Optional'
                                : 'Required for Card / UPI / Bank Transfer'
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          className="w-full"
                          disabled={paymentMutation.isPending}
                          onClick={recordPayment}
                        >
                          {paymentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Recording...
                            </>
                          ) : (
                            'Record Payment'
                          )}
                        </Button>
                      </>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click a bill row or the card icon to collect payment
                    </p>
                  )}
                </CardContent>
              </Card>
            </PermissionGate>
          </div>
        </div>

        {printInvoice ? <BillInvoicePrint invoice={printInvoice} /> : null}
      </>
    </AuthGuard>
  );
}

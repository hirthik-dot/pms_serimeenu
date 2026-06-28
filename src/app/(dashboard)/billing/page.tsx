'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, IndianRupee, Receipt, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AuthGuard } from '@/components/auth/auth-guard';
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
import { apiFetchWithRefresh } from '@/lib/api-client';
import type { BillDto, PaymentDto } from '@/services/bill.service';
import { PaymentMethod } from '@/types/enums';

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
  const [selectedBill, setSelectedBill] = useState<BillDto | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [payRef, setPayRef] = useState('');

  const { data: billsRes, refetch } = useQuery({
    queryKey: ['bills'],
    queryFn: () =>
      apiFetchWithRefresh<{ data: BillDto[]; total: number }>('/bills?limit=50'),
  });

  const { data: outstandingRes } = useQuery({
    queryKey: ['bills', 'outstanding'],
    queryFn: () =>
      apiFetchWithRefresh<{ data: BillDto[]; total: number }>('/bills/outstanding?limit=20'),
  });

  const bills = billsRes?.data?.data ?? [];
  const outstanding = outstandingRes?.data?.data ?? [];
  const totalOutstanding = outstanding.reduce((s, b) => s + b.balanceAmount, 0);

  const recordPayment = async () => {
    if (!selectedBill) return;
    const amount = Number.parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await apiFetchWithRefresh<PaymentDto>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          billId: selectedBill.id,
          amount,
          method: payMethod,
          referenceNumber: payRef || undefined,
        }),
      });
      toast.success('Payment recorded');
      setPayAmount('');
      setPayRef('');
      setSelectedBill(null);
      void refetch();
    } catch {
      toast.error('Payment failed');
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader title="Billing" description="Bills, payments, and outstanding dues" />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Total Bills" value={String(bills.length)} icon={Receipt} />
          <StatCard title="Outstanding" value={`₹${totalOutstanding.toLocaleString()}`} icon={IndianRupee} />
          <StatCard title="Pending" value={String(outstanding.length)} icon={TrendingUp} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Bills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bills yet</p>
              ) : (
                bills.map((bill) => (
                  <button
                    key={bill.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded border p-3 text-left text-sm hover:bg-muted/50"
                    onClick={() => {
                      setSelectedBill(bill);
                      setPayAmount(String(bill.balanceAmount));
                    }}
                  >
                    <div>
                      <p className="font-medium">{bill.billNumber}</p>
                      <p className="text-xs text-muted-foreground">{bill.patientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{bill.totalAmount.toLocaleString()}</p>
                      <Badge variant="outline">{bill.status}</Badge>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Collect Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedBill ? (
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
                    <Input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="UPI ref / cheque no." />
                  </div>
                  <Button type="button" className="w-full" onClick={() => void recordPayment()}>
                    Record Payment
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select a bill to collect payment</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

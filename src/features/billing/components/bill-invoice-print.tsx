'use client';

import type { BillDto } from '@/services/bill.service';
import type { IAddress } from '@/types/models';
import { formatDate } from '@/utils/date';
import { formatAddress } from '@/utils/address';

export interface InvoiceData {
  clinic: {
    name: string;
    phone?: string;
    email?: string;
    address?: string | IAddress;
    gstNumber?: string;
    header?: string;
    footer?: string;
    currencySymbol?: string;
  };
  bill: BillDto;
  payments: Array<{
    id: string;
    receiptNumber: string;
    amount: number;
    method: string;
    createdAt: string;
  }>;
}

export function BillInvoicePrint({ invoice }: { invoice: InvoiceData }) {
  const sym = invoice.clinic.currencySymbol ?? '₹';
  const { bill } = invoice;
  const clinicAddress = formatAddress(invoice.clinic.address);

  return (
    <div id="bill-invoice-print" className="print-only p-8">
      <div className="mb-6 border-b pb-4 text-center">
        <h1 className="text-xl font-bold">{invoice.clinic.header ?? invoice.clinic.name}</h1>
        {clinicAddress ? <p className="text-sm">{clinicAddress}</p> : null}
        <p className="text-sm">
          {[invoice.clinic.phone, invoice.clinic.email].filter(Boolean).join(' | ')}
        </p>
        {invoice.clinic.gstNumber ? (
          <p className="text-sm">GST: {invoice.clinic.gstNumber}</p>
        ) : null}
      </div>

      <div className="mb-4 flex justify-between text-sm">
        <div>
          <p><strong>Bill No:</strong> {bill.billNumber}</p>
          <p><strong>Date:</strong> {formatDate(bill.createdAt)}</p>
          <p><strong>Patient:</strong> {bill.patientName}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold capitalize">{bill.status.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <table className="mb-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="py-2 text-left">Description</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">Discount</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {bill.lineItems.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">{item.description}</td>
              <td className="py-1 text-right">{item.quantity}</td>
              <td className="py-1 text-right">{sym}{item.unitPrice.toLocaleString()}</td>
              <td className="py-1 text-right">{sym}{item.discount.toLocaleString()}</td>
              <td className="py-1 text-right">{sym}{item.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-64 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{sym}{bill.subtotal.toLocaleString()}</span>
        </div>
        {bill.discountAmount > 0 ? (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{sym}{bill.discountAmount.toLocaleString()}</span>
          </div>
        ) : null}
        {bill.taxAmount > 0 ? (
          <div className="flex justify-between">
            <span>Tax ({bill.taxRate}%)</span>
            <span>{sym}{bill.taxAmount.toLocaleString()}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t pt-1 font-bold">
          <span>Total</span>
          <span>{sym}{bill.totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Paid</span>
          <span>{sym}{bill.paidAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Balance</span>
          <span>{sym}{bill.balanceAmount.toLocaleString()}</span>
        </div>
      </div>

      {invoice.payments.length > 0 ? (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold">Payment History</h3>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-1 text-left">Receipt</th>
                <th className="py-1 text-left">Date</th>
                <th className="py-1 text-left">Method</th>
                <th className="py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-1">{p.receiptNumber}</td>
                  <td className="py-1">{formatDate(p.createdAt)}</td>
                  <td className="py-1 capitalize">{p.method.replace(/_/g, ' ')}</td>
                  <td className="py-1 text-right">{sym}{p.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {invoice.clinic.footer ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">{invoice.clinic.footer}</p>
      ) : null}
    </div>
  );
}

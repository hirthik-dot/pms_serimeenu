'use client';

import type { BillDto } from '@/services/bill.service';
import type { PatientDetail } from '@/types/patient';
import { formatDate } from '@/utils/date';

import type { PrescriptionRecordSummary } from '../api/reports-api';

const REFERRAL_LABELS: Record<string, string> = {
  doctor: 'Doctor',
  ads: 'Ads',
  friend: 'Friend',
  social_media: 'Social Media',
  walk_in: 'Walk-in',
  website: 'Website',
  other: 'Other',
};

interface PatientRecordPrintProps {
  patient: PatientDetail;
  bills: BillDto[];
  prescriptions: PrescriptionRecordSummary[];
}

export function PatientRecordPrint({ patient, bills, prescriptions }: PatientRecordPrintProps) {
  return (
    <div id="patient-record-print" className="print-only p-8">
      <div className="mb-6 border-b pb-4 text-center">
        <h1 className="text-xl font-bold">Patient Record</h1>
        <p className="text-sm text-muted-foreground">Generated on {formatDate(new Date().toISOString())}</p>
      </div>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">Personal Information</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><strong>Patient ID:</strong> {patient.patientId}</p>
          <p><strong>Name:</strong> {patient.fullName}</p>
          <p><strong>Age:</strong> {patient.age} years</p>
          <p><strong>DOB:</strong> {formatDate(patient.dateOfBirth)}</p>
          <p><strong>Gender:</strong> {patient.gender.replace(/_/g, ' ')}</p>
          <p><strong>Phone:</strong> {patient.phone || 'N/A'}</p>
          <p><strong>Email:</strong> {patient.email || 'N/A'}</p>
          <p>
            <strong>Referred By:</strong>{' '}
            {patient.referredBy ? REFERRAL_LABELS[patient.referredBy] ?? patient.referredBy : 'N/A'}
          </p>
          <p className="col-span-2">
            <strong>Address:</strong>{' '}
            {[patient.address.street, patient.address.city, patient.address.state, patient.address.pincode]
              .filter(Boolean)
              .join(', ')}
          </p>
          <p className="col-span-2"><strong>Chief Complaint:</strong> {patient.notes || 'N/A'}</p>
          {patient.allergies.length > 0 ? (
            <p className="col-span-2"><strong>Allergies:</strong> {patient.allergies.join(', ')}</p>
          ) : null}
        </div>
      </section>

      {prescriptions.length > 0 ? (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Prescriptions</h2>
          {prescriptions.map((rx) => (
            <div key={rx.id} className="mb-4 border-b pb-3 text-sm">
              <p className="font-medium">
                {formatDate(rx.date)} — {rx.doctorName}
              </p>
              <ul className="mt-1 list-disc pl-5">
                {rx.medications.map((med, i) => (
                  <li key={i}>
                    {med.name} — {med.dosage}, {med.frequency.replace(/_/g, ' ')} for {med.duration}{' '}
                    {med.durationUnit}
                    {med.instructions ? ` (${med.instructions})` : ''}
                  </li>
                ))}
              </ul>
              {rx.generalInstructions ? (
                <p className="mt-1 text-muted-foreground">Instructions: {rx.generalInstructions}</p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {bills.length > 0 ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Bills</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-1 text-left">Bill #</th>
                <th className="py-1 text-left">Date</th>
                <th className="py-1 text-right">Total</th>
                <th className="py-1 text-right">Paid</th>
                <th className="py-1 text-right">Balance</th>
                <th className="py-1 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b">
                  <td className="py-1">{bill.billNumber}</td>
                  <td className="py-1">{formatDate(bill.createdAt)}</td>
                  <td className="py-1 text-right">₹{bill.totalAmount.toLocaleString()}</td>
                  <td className="py-1 text-right">₹{bill.paidAmount.toLocaleString()}</td>
                  <td className="py-1 text-right">₹{bill.balanceAmount.toLocaleString()}</td>
                  <td className="py-1 capitalize">{bill.status.replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}

export function PrescriptionPrint({
  prescription,
  patient,
}: {
  prescription: PrescriptionRecordSummary;
  patient: PatientDetail;
}) {
  return (
    <div id="prescription-print" className="print-only p-8">
      <div className="mb-6 border-b pb-4 text-center">
        <h1 className="text-xl font-bold">Prescription</h1>
        <p className="text-sm">{formatDate(prescription.date)}</p>
      </div>
      <div className="mb-4 text-sm">
        <p><strong>Patient:</strong> {patient.fullName} ({patient.patientId})</p>
        <p><strong>Age:</strong> {patient.age} | <strong>Gender:</strong> {patient.gender.replace(/_/g, ' ')}</p>
        <p><strong>Doctor:</strong> {prescription.doctorName}</p>
      </div>
      <table className="mb-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-1 text-left">Medicine</th>
            <th className="py-1 text-left">Dosage</th>
            <th className="py-1 text-left">Frequency</th>
            <th className="py-1 text-left">Duration</th>
          </tr>
        </thead>
        <tbody>
          {prescription.medications.map((med, i) => (
            <tr key={i} className="border-b">
              <td className="py-1">{med.name}</td>
              <td className="py-1">{med.dosage}</td>
              <td className="py-1 capitalize">{med.frequency.replace(/_/g, ' ')}</td>
              <td className="py-1">{med.duration} {med.durationUnit}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {prescription.generalInstructions ? (
        <p className="text-sm"><strong>Instructions:</strong> {prescription.generalInstructions}</p>
      ) : null}
      {prescription.followUpDate ? (
        <p className="mt-2 text-sm"><strong>Follow-up:</strong> {formatDate(prescription.followUpDate)}</p>
      ) : null}
    </div>
  );
}

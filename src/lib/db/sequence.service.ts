// =============================================================================
// Sequence Service — Atomic auto-increment for IDs and tokens
// =============================================================================

import type { ClientSession } from 'mongoose';

import { PATIENT_ID, SEQUENCES } from '@/constants/app';
import { SequenceModel } from '@/models/sequence.model';
import { SequenceKey } from '@/types/enums';
import { formatHospitalId } from '@/utils/hospital-id';

function currentYear(): number {
  return new Date().getFullYear();
}

function formatDatedSequence(prefix: string, year: number, value: number): string {
  const padded = String(value).padStart(SEQUENCES.PAD_LENGTH, '0');
  return `${prefix}-${year}-${padded}`;
}

async function incrementSequence(
  filter: Record<string, unknown>,
  session?: ClientSession,
): Promise<number> {
  const doc = await SequenceModel.findOneAndUpdate(
    filter,
    { $inc: { value: 1 } },
    { new: true, upsert: true, session, setDefaultsOnInsert: true },
  ).exec();

  return doc?.value ?? 1;
}

export async function nextPatientId(
  prefix = PATIENT_ID.DEFAULT_PREFIX,
  session?: ClientSession,
): Promise<string> {
  const value = await incrementSequence(
    { key: SequenceKey.Patient, prefix: prefix.toUpperCase() },
    session,
  );
  return formatHospitalId(prefix, value, PATIENT_ID.SEQUENCE_PAD_LENGTH);
}

export async function nextVisitCode(session?: ClientSession): Promise<string> {
  const year = currentYear();
  const value = await incrementSequence({ key: SequenceKey.VisitGlobal, year }, session);
  return formatDatedSequence(SEQUENCES.VISIT_PREFIX, year, value);
}

export async function nextInvoiceNumber(session?: ClientSession): Promise<string> {
  const year = currentYear();
  const value = await incrementSequence({ key: SequenceKey.Invoice, year }, session);
  return formatDatedSequence(SEQUENCES.INVOICE_PREFIX, year, value);
}

export async function nextReceiptNumber(session?: ClientSession): Promise<string> {
  const year = currentYear();
  const value = await incrementSequence({ key: SequenceKey.Receipt, year }, session);
  return formatDatedSequence(SEQUENCES.RECEIPT_PREFIX, year, value);
}

export async function nextQueueTokenNumber(
  doctorId: string,
  date: string,
  session?: ClientSession,
): Promise<number> {
  return incrementSequence(
    { key: 'queue_token', doctorId, date },
    session,
  );
}

export async function nextVisitNumberForPatient(
  patientId: string,
  session?: ClientSession,
): Promise<number> {
  return incrementSequence({ key: `visit_patient_${patientId}` }, session);
}

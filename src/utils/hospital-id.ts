import { PATIENT_ID } from '@/constants/app';

export function formatHospitalId(
  prefix: string,
  sequence: number,
  padLength = PATIENT_ID.SEQUENCE_PAD_LENGTH,
): string {
  return `${prefix}-${String(sequence).padStart(padLength, '0')}`;
}

export function parseHospitalId(hospitalId: string): { prefix: string; sequence: number } | null {
  const match = /^([A-Z0-9]+)-(\d+)$/.exec(hospitalId.trim().toUpperCase());
  if (!match?.[1] || !match[2]) return null;

  return {
    prefix: match[1],
    sequence: Number.parseInt(match[2], 10),
  };
}

export function isValidHospitalId(hospitalId: string): boolean {
  return parseHospitalId(hospitalId) !== null;
}

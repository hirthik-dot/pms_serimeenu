import {
  ADULT_FDI_TEETH,
  ADULT_UNIVERSAL_TEETH,
  PEDIATRIC_FDI_TEETH,
  PEDIATRIC_UNIVERSAL_LABELS,
  type DentitionType,
} from '@/features/odontogram/constants/dentition';
import { ToothNumberingSystem } from '@/types/enums';

const fdiToUniversalAdult = new Map<number, number>(
  ADULT_FDI_TEETH.map((fdi, i) => [fdi, ADULT_UNIVERSAL_TEETH[i]!]),
);

const universalToFdiAdult = new Map<number, number>(
  ADULT_UNIVERSAL_TEETH.map((uni, i) => [uni, ADULT_FDI_TEETH[i]!]),
);

const fdiToUniversalPediatric = new Map<number, string>(
  PEDIATRIC_FDI_TEETH.map((fdi, i) => [fdi, PEDIATRIC_UNIVERSAL_LABELS[i]!]),
);

const universalToFdiPediatric = new Map<string, number>(
  PEDIATRIC_UNIVERSAL_LABELS.map((label, i) => [label, PEDIATRIC_FDI_TEETH[i]!]),
);

export function fdiToDisplayNumber(
  fdiNumber: number,
  system: ToothNumberingSystem,
  dentition: DentitionType,
): string {
  if (system === ToothNumberingSystem.FDI || system === ToothNumberingSystem.Palmer) {
    return String(fdiNumber);
  }
  if (dentition === 'pediatric') {
    return fdiToUniversalPediatric.get(fdiNumber) ?? String(fdiNumber);
  }
  return String(fdiToUniversalAdult.get(fdiNumber) ?? fdiNumber);
}

export function displayToFdiNumber(
  display: string | number,
  system: ToothNumberingSystem,
  dentition: DentitionType,
): number | null {
  if (system === ToothNumberingSystem.FDI || system === ToothNumberingSystem.Palmer) {
    const n = typeof display === 'number' ? display : Number.parseInt(display, 10);
    return Number.isNaN(n) ? null : n;
  }

  if (dentition === 'pediatric') {
    const label = String(display).toUpperCase();
    return universalToFdiPediatric.get(label) ?? null;
  }

  const n = typeof display === 'number' ? display : Number.parseInt(display, 10);
  return universalToFdiAdult.get(n) ?? null;
}

export function normalizeToothSearchQuery(
  query: string,
  system: ToothNumberingSystem,
  dentition: DentitionType,
): number | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  return displayToFdiNumber(trimmed, system, dentition);
}

import { PatientType } from '@/types/enums';

export type DentitionType = 'adult' | 'pediatric';

/** ISO/FDI adult permanent teeth (32) */
export const ADULT_FDI_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  38, 37, 36, 35, 34, 33, 32, 31,
  48, 47, 46, 45, 44, 43, 42, 41,
] as const;

/** ISO/FDI primary teeth (20) */
export const PEDIATRIC_FDI_TEETH = [
  55, 54, 53, 52, 51,
  61, 62, 63, 64, 65,
  75, 74, 73, 72, 71,
  85, 84, 83, 82, 81,
] as const;

/** Universal numbering 1–32 for adult dentition (maps to FDI order above) */
export const ADULT_UNIVERSAL_TEETH = [
  1, 2, 3, 4, 5, 6, 7, 8,
  9, 10, 11, 12, 13, 14, 15, 16,
  17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30, 31, 32,
] as const;

/** Primary universal letters A–T */
export const PEDIATRIC_UNIVERSAL_LABELS = [
  'A', 'B', 'C', 'D', 'E',
  'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T',
] as const;

export const TOOTH_NAMES: Record<number, string> = {
  11: 'Upper Right Central Incisor',
  12: 'Upper Right Lateral Incisor',
  13: 'Upper Right Canine',
  14: 'Upper Right First Premolar',
  15: 'Upper Right Second Premolar',
  16: 'Upper Right First Molar',
  17: 'Upper Right Second Molar',
  18: 'Upper Right Third Molar',
  21: 'Upper Left Central Incisor',
  22: 'Upper Left Lateral Incisor',
  23: 'Upper Left Canine',
  24: 'Upper Left First Premolar',
  25: 'Upper Left Second Premolar',
  26: 'Upper Left First Molar',
  27: 'Upper Left Second Molar',
  28: 'Upper Left Third Molar',
  31: 'Lower Left Central Incisor',
  32: 'Lower Left Lateral Incisor',
  33: 'Lower Left Canine',
  34: 'Lower Left First Premolar',
  35: 'Lower Left Second Premolar',
  36: 'Lower Left First Molar',
  37: 'Lower Left Second Molar',
  38: 'Lower Left Third Molar',
  41: 'Lower Right Central Incisor',
  42: 'Lower Right Lateral Incisor',
  43: 'Lower Right Canine',
  44: 'Lower Right First Premolar',
  45: 'Lower Right Second Premolar',
  46: 'Lower Right First Molar',
  47: 'Lower Right Second Molar',
  48: 'Lower Right Third Molar',
  51: 'Upper Right Primary Central Incisor',
  52: 'Upper Right Primary Lateral Incisor',
  53: 'Upper Right Primary Canine',
  54: 'Upper Right Primary First Molar',
  55: 'Upper Right Primary Second Molar',
  61: 'Upper Left Primary Central Incisor',
  62: 'Upper Left Primary Lateral Incisor',
  63: 'Upper Left Primary Canine',
  64: 'Upper Left Primary First Molar',
  65: 'Upper Left Primary Second Molar',
  71: 'Lower Left Primary Central Incisor',
  72: 'Lower Left Primary Lateral Incisor',
  73: 'Lower Left Primary Canine',
  74: 'Lower Left Primary First Molar',
  75: 'Lower Left Primary Second Molar',
  81: 'Lower Right Primary Central Incisor',
  82: 'Lower Right Primary Lateral Incisor',
  83: 'Lower Right Primary Canine',
  84: 'Lower Right Primary First Molar',
  85: 'Lower Right Primary Second Molar',
};

export function getQuadrant(toothNumber: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 {
  const q = Math.floor(toothNumber / 10);
  if (q >= 1 && q <= 8) return q as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  return 1;
}

export function resolveDentitionType(
  patientType?: PatientType | string,
  age?: number,
  override?: DentitionType,
): DentitionType {
  if (override) return override;
  if (patientType === PatientType.Pediatric) return 'pediatric';
  if (age !== undefined && age < 12) return 'pediatric';
  return 'adult';
}

export function getTeethForDentition(dentition: DentitionType): readonly number[] {
  return dentition === 'pediatric' ? PEDIATRIC_FDI_TEETH : ADULT_FDI_TEETH;
}

export function isValidToothForDentition(toothNumber: number, dentition: DentitionType): boolean {
  return getTeethForDentition(dentition).some((n) => n === toothNumber);
}

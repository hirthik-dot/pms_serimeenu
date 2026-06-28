export const NOTE_TEMPLATES = [
  {
    id: 'routine',
    label: 'Routine Checkup',
    content:
      'Patient presented for routine dental examination. Oral hygiene reviewed. No acute complaints.',
  },
  {
    id: 'pain',
    label: 'Pain Assessment',
    content:
      'Patient reports dental pain. Onset, duration, and aggravating factors documented. Clinical examination performed.',
  },
  {
    id: 'post-op',
    label: 'Post-Operative',
    content:
      'Post-operative review. Healing progressing as expected. Patient advised on care instructions.',
  },
  {
    id: 'extraction',
    label: 'Extraction Follow-up',
    content:
      'Extraction site inspected. Minimal swelling noted. Socket healing adequately. Sutures intact.',
  },
] as const;

export const NOTE_SNIPPETS = [
  'Patient cooperative during examination.',
  'Advised soft diet for 24 hours.',
  'Oral hygiene instructions reinforced.',
  'Follow-up appointment recommended.',
  'No signs of infection observed.',
  'Sensitivity noted on cold stimulus.',
  'Periodontal health stable.',
] as const;

export const XRAY_TYPE_LABELS: Record<string, string> = {
  opg: 'OPG',
  iopa: 'IOPA',
  cbct: 'CBCT',
  clinical_photo: 'Clinical Photo',
  custom: 'Custom',
};

export const AUTO_SAVE_DEBOUNCE_MS = 800;
export const DRAFT_STORAGE_PREFIX = 'pms-consultation-draft-';

import { ToothStatus } from '@/types/enums';

export interface ToothStatusMeta {
  label: string;
  color: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed';
  fillOpacity?: number;
}

/** Visual tokens mapped to design system CSS variables */
export const TOOTH_STATUS_META: Record<ToothStatus, ToothStatusMeta> = {
  [ToothStatus.Healthy]: {
    label: 'Healthy',
    color: 'var(--color-success)',
    fillOpacity: 0.15,
  },
  [ToothStatus.Decayed]: {
    label: 'Caries',
    color: 'var(--color-destructive)',
    fillOpacity: 0.45,
  },
  [ToothStatus.Filled]: {
    label: 'Filling',
    color: 'var(--color-info)',
    fillOpacity: 0.4,
  },
  [ToothStatus.Missing]: {
    label: 'Missing',
    color: 'var(--color-muted-foreground)',
    fillOpacity: 0.2,
  },
  [ToothStatus.Crowned]: {
    label: 'Crown',
    color: '#9333ea',
    fillOpacity: 0.45,
  },
  [ToothStatus.RootCanal]: {
    label: 'Root Canal',
    color: 'var(--color-warning)',
    fillOpacity: 0.45,
  },
  [ToothStatus.Implant]: {
    label: 'Implant',
    color: 'var(--color-primary)',
    fillOpacity: 0.5,
  },
  [ToothStatus.Bridge]: {
    label: 'Bridge',
    color: '#7c3aed',
    fillOpacity: 0.4,
  },
  [ToothStatus.Extracted]: {
    label: 'Extracted',
    color: 'var(--color-muted-foreground)',
    fillOpacity: 0.1,
  },
  [ToothStatus.Impacted]: {
    label: 'Impacted',
    color: 'var(--color-warning)',
    fillOpacity: 0.35,
  },
  [ToothStatus.Fractured]: {
    label: 'Fracture',
    color: 'var(--color-destructive)',
    fillOpacity: 0.3,
  },
};

/** UI condition options mapped to ToothStatus for clinical entry */
export const CONDITION_OPTIONS = [
  { value: ToothStatus.Healthy, label: 'Healthy' },
  { value: ToothStatus.Decayed, label: 'Caries / Deep Caries' },
  { value: ToothStatus.Filled, label: 'Filling / Composite / Amalgam' },
  { value: ToothStatus.RootCanal, label: 'Root Canal' },
  { value: ToothStatus.Crowned, label: 'Crown' },
  { value: ToothStatus.Bridge, label: 'Bridge' },
  { value: ToothStatus.Implant, label: 'Implant' },
  { value: ToothStatus.Missing, label: 'Missing' },
  { value: ToothStatus.Extracted, label: 'Extracted' },
  { value: ToothStatus.Fractured, label: 'Fracture' },
  { value: ToothStatus.Impacted, label: 'Impacted' },
] as const;

export const PROCEDURE_OPTIONS = [
  'Scaling',
  'Cleaning',
  'Filling',
  'Extraction',
  'RCT',
  'Crown',
  'Bridge',
  'Implant',
  'Whitening',
  'Fluoride',
  'Pulpotomy',
  'Pulpectomy',
  'Custom Procedure',
] as const;

export type OdontogramFilter =
  | 'all'
  | 'caries'
  | 'rct'
  | 'missing'
  | 'crowns'
  | 'implants'
  | 'planned';

export const FILTER_STATUS_MAP: Record<Exclude<OdontogramFilter, 'all' | 'planned'>, ToothStatus[]> = {
  caries: [ToothStatus.Decayed],
  rct: [ToothStatus.RootCanal],
  missing: [ToothStatus.Missing, ToothStatus.Extracted],
  crowns: [ToothStatus.Crowned],
  implants: [ToothStatus.Implant],
};

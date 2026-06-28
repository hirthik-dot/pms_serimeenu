import {
  ADULT_FDI_TEETH,
  PEDIATRIC_FDI_TEETH,
  type DentitionType,
} from '@/features/odontogram/constants/dentition';

export interface ToothLayout {
  toothNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  arch: 'upper' | 'lower';
  side: 'left' | 'right';
}

const TOOTH_WIDTH = 36;
const TOOTH_HEIGHT = 52;
const TOOTH_GAP = 4;
const CHART_CENTER_X = 400;

function buildRowLayout(
  teeth: readonly number[],
  y: number,
  arch: 'upper' | 'lower',
  side: 'left' | 'right',
  startX: number,
  direction: 1 | -1,
): ToothLayout[] {
  return teeth.map((toothNumber, index) => ({
    toothNumber,
    x: startX + direction * index * (TOOTH_WIDTH + TOOTH_GAP),
    y,
    width: TOOTH_WIDTH,
    height: TOOTH_HEIGHT,
    arch,
    side,
  }));
}

export function getToothLayouts(dentition: DentitionType): ToothLayout[] {
  if (dentition === 'pediatric') {
    const upperRight = PEDIATRIC_FDI_TEETH.slice(0, 5);
    const upperLeft = PEDIATRIC_FDI_TEETH.slice(5, 10);
    const lowerLeft = PEDIATRIC_FDI_TEETH.slice(10, 15);
    const lowerRight = PEDIATRIC_FDI_TEETH.slice(15, 20);

    const upperRightStart = CHART_CENTER_X - TOOTH_GAP - 5 * (TOOTH_WIDTH + TOOTH_GAP);
    const upperLeftStart = CHART_CENTER_X + TOOTH_GAP + TOOTH_WIDTH;
    const lowerLeftStart = CHART_CENTER_X + TOOTH_GAP + TOOTH_WIDTH;
    const lowerRightStart = CHART_CENTER_X - TOOTH_GAP - 5 * (TOOTH_WIDTH + TOOTH_GAP);

    return [
      ...buildRowLayout(upperRight, 60, 'upper', 'right', upperRightStart, 1),
      ...buildRowLayout(upperLeft, 60, 'upper', 'left', upperLeftStart, 1),
      ...buildRowLayout(lowerLeft, 220, 'lower', 'left', lowerLeftStart, 1),
      ...buildRowLayout([...lowerRight].reverse(), 220, 'lower', 'right', lowerRightStart, 1),
    ];
  }

  const upperRight = ADULT_FDI_TEETH.slice(0, 8);
  const upperLeft = ADULT_FDI_TEETH.slice(8, 16);
  const lowerLeft = ADULT_FDI_TEETH.slice(16, 24);
  const lowerRight = ADULT_FDI_TEETH.slice(24, 32);

  const upperRightStart = CHART_CENTER_X - TOOTH_GAP - 8 * (TOOTH_WIDTH + TOOTH_GAP);
  const upperLeftStart = CHART_CENTER_X + TOOTH_GAP + TOOTH_WIDTH;
  const lowerLeftStart = CHART_CENTER_X + TOOTH_GAP + TOOTH_WIDTH;
  const lowerRightStart = CHART_CENTER_X - TOOTH_GAP - 8 * (TOOTH_WIDTH + TOOTH_GAP);

  return [
    ...buildRowLayout(upperRight, 50, 'upper', 'right', upperRightStart, 1),
    ...buildRowLayout(upperLeft, 50, 'upper', 'left', upperLeftStart, 1),
    ...buildRowLayout(lowerLeft, 230, 'lower', 'left', lowerLeftStart, 1),
    ...buildRowLayout([...lowerRight].reverse(), 230, 'lower', 'right', lowerRightStart, 1),
  ];
}

export const ODONTOGRAM_VIEWBOX = { width: 800, height: 340 };

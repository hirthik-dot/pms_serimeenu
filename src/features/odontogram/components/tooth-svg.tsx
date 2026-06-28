'use client';

import { memo, useCallback } from 'react';

import { TOOTH_NAMES } from '@/features/odontogram/constants/dentition';
import { TOOTH_STATUS_META } from '@/features/odontogram/constants/tooth-status';
import type { ToothLayout } from '@/features/odontogram/utils/layout';
import { fdiToDisplayNumber } from '@/features/odontogram/utils/numbering';
import type { ToothEntryDto } from '@/types/consultation';
import { type ToothNumberingSystem, ToothStatus, type ToothSurface } from '@/types/enums';

interface ToothSvgProps {
  layout: ToothLayout;
  entry?: ToothEntryDto;
  displayNumber: string;
  isSelected: boolean;
  isHighlighted: boolean;
  isFiltered: boolean;
  numberingSystem: ToothNumberingSystem;
  dentition: 'adult' | 'pediatric';
  onSelect: (toothNumber: number) => void;
  onDoubleClick: (toothNumber: number) => void;
  onContextMenu: (toothNumber: number, event: React.MouseEvent) => void;
  onSurfaceClick?: (toothNumber: number, surface: ToothSurface) => void;
  tabIndex?: number;
}

const SURFACE_PATHS: Record<ToothSurface, string> = {
  occlusal: 'M 8 14 L 28 14 L 24 22 L 12 22 Z',
  mesial: 'M 4 8 L 12 14 L 12 28 L 4 34 Z',
  distal: 'M 32 8 L 24 14 L 24 28 L 32 34 Z',
  buccal: 'M 12 4 L 24 4 L 28 14 L 12 14 Z',
  lingual: 'M 12 28 L 24 28 L 28 34 L 12 34 Z',
  incisal: 'M 8 14 L 28 14 L 24 22 L 12 22 Z',
};

function ToothSvgComponent({
  layout,
  entry,
  displayNumber,
  isSelected,
  isHighlighted,
  isFiltered,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onSurfaceClick,
  tabIndex = 0,
}: ToothSvgProps) {
  const status = entry?.status ?? ToothStatus.Healthy;
  const meta = TOOTH_STATUS_META[status];
  const toothName = TOOTH_NAMES[layout.toothNumber] ?? `Tooth ${layout.toothNumber}`;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(layout.toothNumber);
      }
    },
    [layout.toothNumber, onSelect],
  );

  const opacity = isFiltered ? 0.25 : 1;

  return (
    <g
      transform={`translate(${layout.x}, ${layout.y})`}
      opacity={opacity}
      role="button"
      tabIndex={tabIndex}
      aria-label={`${toothName}, ${meta.label}, number ${displayNumber}`}
      aria-pressed={isSelected}
      onKeyDown={handleKeyDown}
      onClick={() => onSelect(layout.toothNumber)}
      onDoubleClick={() => onDoubleClick(layout.toothNumber)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(layout.toothNumber, e);
      }}
      className="cursor-pointer outline-none focus-visible:outline-none"
    >
      <title>{`${displayNumber} — ${toothName} (${meta.label})`}</title>

      {isSelected && (
        <rect
          x={-2}
          y={-2}
          width={layout.width + 4}
          height={layout.height + 4}
          rx={6}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2}
        />
      )}

      {isHighlighted && !isSelected && (
        <rect
          x={-1}
          y={-1}
          width={layout.width + 2}
          height={layout.height + 2}
          rx={5}
          fill="none"
          stroke="var(--color-warning)"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
      )}

      <rect
        x={0}
        y={0}
        width={layout.width}
        height={layout.height}
        rx={4}
        fill={meta.color}
        fillOpacity={meta.fillOpacity ?? 0.3}
        stroke="var(--color-border)"
        strokeWidth={1}
      />

      {(Object.entries(SURFACE_PATHS) as [ToothSurface, string][]).map(([surface, d]) => {
        const surfaceStatus = entry?.surfaces?.[surface];
        const surfaceMeta = surfaceStatus ? TOOTH_STATUS_META[surfaceStatus] : null;
        return (
          <path
            key={surface}
            d={d}
            fill={surfaceMeta?.color ?? 'transparent'}
            fillOpacity={surfaceMeta ? 0.5 : 0}
            stroke="var(--color-border)"
            strokeWidth={0.5}
            pointerEvents="all"
            onClick={(e) => {
              e.stopPropagation();
              onSurfaceClick?.(layout.toothNumber, surface);
            }}
          />
        );
      })}

      {(status === ToothStatus.Missing || status === ToothStatus.Extracted) && (
        <line
          x1={4}
          y1={4}
          x2={layout.width - 4}
          y2={layout.height - 4}
          stroke="var(--color-muted-foreground)"
          strokeWidth={2}
        />
      )}

      <text
        x={layout.width / 2}
        y={layout.height / 2 + 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="var(--color-foreground)"
        pointerEvents="none"
      >
        {displayNumber}
      </text>
    </g>
  );
}

export const ToothSvg = memo(ToothSvgComponent);

export function getDisplayNumber(
  toothNumber: number,
  numberingSystem: ToothNumberingSystem,
  dentition: 'adult' | 'pediatric',
): string {
  return fdiToDisplayNumber(toothNumber, numberingSystem, dentition);
}

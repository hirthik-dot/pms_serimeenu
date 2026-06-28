'use client';

import { memo, useCallback, useMemo, useRef } from 'react';

import { ToothSvg, getDisplayNumber } from '@/features/odontogram/components/tooth-svg';
import {
  FILTER_STATUS_MAP,
  type OdontogramFilter,
} from '@/features/odontogram/constants/tooth-status';
import { getToothLayouts, ODONTOGRAM_VIEWBOX } from '@/features/odontogram/utils/layout';
import type { ToothEntryDto } from '@/types/consultation';
import { ToothStatus } from '@/types/enums';
import type { ToothNumberingSystem } from '@/types/enums';

interface OdontogramChartProps {
  dentition: 'adult' | 'pediatric';
  numberingSystem: ToothNumberingSystem;
  teethMap: Map<number, ToothEntryDto>;
  selectedTooth: number | null;
  filter: OdontogramFilter;
  searchTooth: number | null;
  zoom: number;
  onSelect: (toothNumber: number) => void;
  onDoubleClick: (toothNumber: number) => void;
  onContextMenu: (toothNumber: number, event: React.MouseEvent) => void;
}

function matchesFilter(status: ToothStatus, filter: OdontogramFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'planned') return false;
  const statuses = FILTER_STATUS_MAP[filter];
  return statuses.includes(status);
}

export const OdontogramChart = memo(function OdontogramChart({
  dentition,
  numberingSystem,
  teethMap,
  selectedTooth,
  filter,
  searchTooth,
  zoom,
  onSelect,
  onDoubleClick,
  onContextMenu,
}: OdontogramChartProps) {
  const layouts = useMemo(() => getToothLayouts(dentition), [dentition]);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHighlighted = useCallback(
    (toothNumber: number, status: ToothStatus) => {
      if (searchTooth === toothNumber) return true;
      if (filter !== 'all' && matchesFilter(status, filter)) return true;
      return false;
    },
    [filter, searchTooth],
  );

  const isFiltered = useCallback(
    (status: ToothStatus) => {
      if (filter === 'all') return false;
      return !matchesFilter(status, filter);
    },
    [filter],
  );

  return (
    <div
      ref={containerRef}
      className="overflow-auto rounded-lg border bg-card p-2"
      style={{ maxHeight: '320px' }}
    >
      <svg
        viewBox={`0 0 ${ODONTOGRAM_VIEWBOX.width} ${ODONTOGRAM_VIEWBOX.height}`}
        width={ODONTOGRAM_VIEWBOX.width * zoom}
        height={ODONTOGRAM_VIEWBOX.height * zoom}
        className="mx-auto"
        role="img"
        aria-label="Dental odontogram chart"
      >
        <text x={400} y={20} textAnchor="middle" fontSize={12} fill="var(--color-muted-foreground)">
          Upper
        </text>
        <text x={400} y={310} textAnchor="middle" fontSize={12} fill="var(--color-muted-foreground)">
          Lower
        </text>
        <line
          x1={400}
          y1={30}
          x2={400}
          y2={300}
          stroke="var(--color-border)"
          strokeDasharray="4 4"
        />
        {layouts.map((layout) => {
          const entry = teethMap.get(layout.toothNumber);
          const status = entry?.status ?? ToothStatus.Healthy;
          const displayNumber = getDisplayNumber(layout.toothNumber, numberingSystem, dentition);
          return (
            <ToothSvg
              key={layout.toothNumber}
              layout={layout}
              entry={entry}
              displayNumber={displayNumber}
              isSelected={selectedTooth === layout.toothNumber}
              isHighlighted={isHighlighted(layout.toothNumber, status)}
              isFiltered={isFiltered(status)}
              numberingSystem={numberingSystem}
              dentition={dentition}
              onSelect={onSelect}
              onDoubleClick={onDoubleClick}
              onContextMenu={onContextMenu}
            />
          );
        })}
      </svg>
    </div>
  );
});

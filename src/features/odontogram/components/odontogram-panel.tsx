'use client';

import { Grid3X3, Loader2, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { OdontogramChart } from '@/features/odontogram/components/odontogram-chart';
import {
  CONDITION_OPTIONS,
  TOOTH_STATUS_META,
  type OdontogramFilter,
} from '@/features/odontogram/constants/tooth-status';
import { useToothChart } from '@/features/odontogram/hooks/use-tooth-chart';
import { normalizeToothSearchQuery } from '@/features/odontogram/utils/numbering';
import { ToothNumberingSystem, ToothStatus } from '@/types/enums';

interface OdontogramPanelProps {
  visitId: string;
  patientId: string;
  patientType?: string;
  patientAge?: number;
  isEditable?: boolean;
  onToothSelect?: (toothNumbers: number[]) => void;
}

const ZOOM_LEVELS = [0.75, 1, 1.25, 1.5, 2];

export function OdontogramPanel({
  visitId,
  patientId,
  patientType,
  patientAge,
  isEditable = true,
  onToothSelect,
}: OdontogramPanelProps) {
  const {
    chart,
    teethMap,
    isLoading,
    dentition,
    setDentitionOverride,
    numberingSystem,
    setNumberingSystem,
    updateTooth,
    ensureChart,
    isInitializing,
    isUpdating,
  } = useToothChart({
    visitId,
    patientId,
    patientType,
    patientAge,
    isEditable,
  });

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [filter, setFilter] = useState<OdontogramFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomIndex, setZoomIndex] = useState(1);
  const [editStatus, setEditStatus] = useState<ToothStatus>(ToothStatus.Healthy);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (!chart && !isLoading && !isInitializing) {
      void ensureChart();
    }
  }, [chart, isLoading, isInitializing, ensureChart]);

  const searchTooth = searchQuery
    ? normalizeToothSearchQuery(searchQuery, numberingSystem, dentition)
    : null;

  const handleSelect = useCallback(
    (toothNumber: number) => {
      setSelectedTooth(toothNumber);
      onToothSelect?.([toothNumber]);
      const entry = teethMap.get(toothNumber);
      setEditStatus(entry?.status ?? ToothStatus.Healthy);
      setEditNotes(entry?.notes ?? '');
    },
    [teethMap, onToothSelect],
  );

  const saveTooth = () => {
    if (!selectedTooth || !isEditable) return;
    updateTooth(selectedTooth, { status: editStatus, notes: editNotes || undefined });
    toast.success('Tooth updated');
  };

  const selectedEntry = selectedTooth ? teethMap.get(selectedTooth) : undefined;
  const zoom = ZOOM_LEVELS[zoomIndex] ?? 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Tooth Chart
          </span>
          {(isLoading || isInitializing || isUpdating) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select
            value={numberingSystem}
            onValueChange={(v) => setNumberingSystem(v as ToothNumberingSystem)}
          >
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ToothNumberingSystem.FDI}>FDI</SelectItem>
              <SelectItem value={ToothNumberingSystem.Universal}>Universal</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={dentition}
            onValueChange={(v) => setDentitionOverride(v as 'adult' | 'pediatric')}
          >
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adult">Adult (32)</SelectItem>
              <SelectItem value="pediatric">Pediatric (20)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={(v) => setFilter(v as OdontogramFilter)}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="caries">Caries</SelectItem>
              <SelectItem value="rct">RCT</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="crowns">Crowns</SelectItem>
              <SelectItem value="implants">Implants</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[100px]">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="h-8 pl-7 text-xs"
              placeholder="Search tooth"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>

        <OdontogramChart
          dentition={dentition}
          numberingSystem={numberingSystem}
          teethMap={teethMap}
          selectedTooth={selectedTooth}
          filter={filter}
          searchTooth={searchTooth}
          zoom={zoom}
          onSelect={handleSelect}
          onDoubleClick={handleSelect}
          onContextMenu={(n) => handleSelect(n)}
        />

        {selectedTooth && (
          <div className="space-y-2 rounded-lg border p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">Tooth {selectedTooth}</span>
              {selectedEntry && (
                <Badge variant="outline">
                  {TOOTH_STATUS_META[selectedEntry.status].label}
                </Badge>
              )}
            </div>
            {isEditable && (
              <>
                <div className="space-y-1">
                  <Label>Condition</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(v) => setEditStatus(v as ToothStatus)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
                <Button type="button" size="sm" className="w-full" onClick={saveTooth}>
                  Save Tooth
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

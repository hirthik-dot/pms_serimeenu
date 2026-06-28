'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
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
import { consultationApi } from '@/features/consultation/api/consultation-api';
import type { TreatmentPlanItemDto } from '@/types/consultation';
import {
  TreatmentItemPriority,
  TreatmentItemStatus,
} from '@/types/enums';
import { formatCurrency } from '@/utils/currency';

const PRIORITIES = Object.values(TreatmentItemPriority);
const STATUSES = Object.values(TreatmentItemStatus);

const emptyItem = (): TreatmentPlanItemDto => ({
  procedureName: '',
  toothNumbers: [],
  estimatedCost: 0,
  estimatedTimeMinutes: 30,
  priority: TreatmentItemPriority.Medium,
  status: TreatmentItemStatus.Pending,
  notes: '',
});

interface TreatmentPlanEditorProps {
  name: string;
  description?: string;
  items: TreatmentPlanItemDto[];
  onChange: (name: string, description: string, items: TreatmentPlanItemDto[]) => void;
}

export function TreatmentPlanEditor({
  name: initialName,
  description: initialDescription = '',
  items: initialItems,
  onChange,
}: TreatmentPlanEditorProps) {
  const [name, setName] = useState(initialName || 'Treatment Plan');
  const [description, setDescription] = useState(initialDescription);
  const [items, setItems] = useState<TreatmentPlanItemDto[]>(
    initialItems.length ? initialItems : [emptyItem()],
  );

  const emit = (n: string, d: string, list: TreatmentPlanItemDto[]) => {
    onChange(n, d, list);
  };

  const updateItem = (index: number, patch: Partial<TreatmentPlanItemDto>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    setItems(next);
    emit(name, description, next);
  };

  const searchProcedure = async (index: number, q: string) => {
    if (q.length < 1) return;
    const res = await consultationApi.searchTreatments(q);
    const first = res.data?.[0];
    if (first) {
      updateItem(index, {
        treatmentId: first.id,
        procedureName: first.procedureName,
        procedureCode: first.procedureCode,
        estimatedCost: first.defaultCost,
        estimatedTimeMinutes: first.duration,
      });
    }
  };

  const totalCost = items.reduce((sum, i) => sum + (i.estimatedCost || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Plan Name</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              emit(e.target.value, description, items);
            }}
          />
        </div>
        <div className="flex items-end">
          <p className="text-sm font-medium">
            Total Estimate: {formatCurrency(totalCost)}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            emit(name, e.target.value, items);
          }}
          rows={2}
        />
      </div>

      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Procedure {index + 1}</span>
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const next = items.filter((_, i) => i !== index);
                  setItems(next);
                  emit(name, description, next);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Procedure</Label>
              <Input
                value={item.procedureName}
                onChange={(e) => updateItem(index, { procedureName: e.target.value })}
                onBlur={(e) => void searchProcedure(index, e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Tooth Reference</Label>
              <Input
                value={item.toothNumbers.join(', ')}
                onChange={(e) => {
                  const nums = e.target.value
                    .split(',')
                    .map((s) => Number.parseInt(s.trim(), 10))
                    .filter((n) => !Number.isNaN(n));
                  updateItem(index, { toothNumbers: nums });
                }}
                placeholder="e.g. 36, 37"
              />
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select
                value={item.priority ?? TreatmentItemPriority.Medium}
                onValueChange={(v) =>
                  updateItem(index, { priority: v as TreatmentItemPriority })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={item.status ?? TreatmentItemStatus.Pending}
                onValueChange={(v) => updateItem(index, { status: v as TreatmentItemStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Est. Cost (₹)</Label>
              <Input
                type="number"
                min={0}
                value={item.estimatedCost}
                onChange={(e) => updateItem(index, { estimatedCost: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Est. Time (min)</Label>
              <Input
                type="number"
                min={0}
                value={item.estimatedTimeMinutes ?? 30}
                onChange={(e) =>
                  updateItem(index, { estimatedTimeMinutes: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Input
              value={item.notes ?? ''}
              onChange={(e) => updateItem(index, { notes: e.target.value })}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          const next = [...items, emptyItem()];
          setItems(next);
          emit(name, description, next);
        }}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Procedure
      </Button>
    </div>
  );
}

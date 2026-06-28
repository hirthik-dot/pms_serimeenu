'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { consultationApi } from '@/features/consultation/api/consultation-api';
import type { ClinicalHistorySearchResult } from '@/types/consultation';
import { formatDate } from '@/utils/date';

const HISTORY_TABS = [
  { key: 'diagnoses', label: 'Diagnosis' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'treatments', label: 'Treatments' },
  { key: 'xrays', label: 'X-rays' },
  { key: 'bills', label: 'Bills' },
  { key: 'notes', label: 'Notes' },
  { key: 'procedures', label: 'Procedures' },
] as const;

interface ClinicalHistoryPanelProps {
  patientId: string;
  onCopyNote?: (text: string) => void;
}

export function ClinicalHistoryPanel({ patientId, onCopyNote }: ClinicalHistoryPanelProps) {
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clinical-history', patientId, query],
    queryFn: () => consultationApi.searchClinicalHistory(patientId, query || undefined),
    enabled: Boolean(patientId),
  });

  const history = data?.data;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search history..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          aria-label="Search clinical history"
        />
      </div>

      <Tabs defaultValue="diagnoses">
        <TabsList className="flex h-auto flex-wrap gap-1">
          {HISTORY_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {HISTORY_TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-3 max-h-48 overflow-y-auto">
            <HistoryList
              items={history?.[tab.key as keyof ClinicalHistorySearchResult] ?? []}
              isLoading={isLoading}
              onCopy={tab.key === 'notes' ? onCopyNote : undefined}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function HistoryList({
  items,
  isLoading,
  onCopy,
}: {
  items: Array<{ id: string; date: string; summary: string; details?: string }>;
  isLoading: boolean;
  onCopy?: (text: string) => void;
}) {
  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Loading...</p>;
  }

  if (!items.length) {
    return <p className="text-xs text-muted-foreground">No records found</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-md border p-2 text-xs hover:bg-muted/50"
        >
          <p className="text-muted-foreground">{formatDate(item.date)}</p>
          <p className="line-clamp-2">{item.summary}</p>
          {onCopy && item.details && (
            <button
              type="button"
              className="mt-1 text-primary hover:underline"
              onClick={() => onCopy(item.details!)}
            >
              Copy note
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

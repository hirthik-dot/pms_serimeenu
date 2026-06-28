'use client';

import { Calendar, FileImage, Scan, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
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
import { AutoSaveIndicator } from '@/features/consultation/components/auto-save-indicator';
import { ConsultationStatusBadge } from '@/features/consultation/components/consultation-status-badge';
import { XRAY_TYPE_LABELS } from '@/features/consultation/constants';
import { OdontogramPanel } from '@/features/odontogram/components/odontogram-panel';
import { patientApi } from '@/features/patients/api/patient-api';
import type { AutoSaveState, ConsultationWorkspaceData } from '@/types/consultation';
import { XrayRequestType } from '@/types/enums';
import { FileCategory } from '@/types/enums';
import { formatDate } from '@/utils/date';

interface ConsultationRightPanelProps {
  workspace: ConsultationWorkspaceData;
  autoSaveState: AutoSaveState;
  isEditable?: boolean;
  onRequestXray: (data: {
    type: XrayRequestType;
    customType?: string;
    toothNumbers: number[];
    notes?: string;
  }) => void;
  onRefresh: () => void;
}

export function ConsultationRightPanel({
  workspace,
  autoSaveState,
  isEditable = true,
  onRequestXray,
  onRefresh,
}: ConsultationRightPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [xrayType, setXrayType] = useState(XrayRequestType.OPG);
  const [customType, setCustomType] = useState('');
  const [toothRef, setToothRef] = useState('');
  const [xrayNotes, setXrayNotes] = useState('');

  const clinicalPhotos = workspace.files.filter(
    (f) => f.category === FileCategory.ClinicalPhoto || f.mimeType.startsWith('image/'),
  );
  const otherFiles = workspace.files.filter((f) => !clinicalPhotos.includes(f));

  const submitXray = () => {
    const toothNumbers = toothRef
      .split(',')
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n));

    onRequestXray({
      type: xrayType,
      customType: xrayType === XrayRequestType.Custom ? customType : undefined,
      toothNumbers,
      notes: xrayNotes || undefined,
    });
    setXrayNotes('');
  };

  const uploadFile = async (file: File, category: FileCategory) => {
    try {
      await patientApi.uploadDocument(workspace.visit.patient.id, file, category, workspace.visit.id);
      toast.success('File uploaded');
      onRefresh();
    } catch {
      toast.error('Upload failed');
    }
  };

  return (
    <div className="sticky top-4 space-y-4">
      <OdontogramPanel
        visitId={workspace.visit.id}
        patientId={workspace.visit.patient.id}
        patientAge={workspace.visit.patient.age}
        isEditable={isEditable}
        onToothSelect={(nums) => setToothRef(nums.join(', '))}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Scan className="h-4 w-4" />
            Request X-rays
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={xrayType} onValueChange={(v) => setXrayType(v as XrayRequestType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(XrayRequestType).map((t) => (
                  <SelectItem key={t} value={t}>
                    {XRAY_TYPE_LABELS[t] ?? t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {xrayType === XrayRequestType.Custom && (
            <div className="space-y-1">
              <Label>Custom Type</Label>
              <Input value={customType} onChange={(e) => setCustomType(e.target.value)} />
            </div>
          )}
          <div className="space-y-1">
            <Label>Tooth Numbers</Label>
            <Input
              value={toothRef}
              onChange={(e) => setToothRef(e.target.value)}
              placeholder="e.g. 36"
            />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea value={xrayNotes} onChange={(e) => setXrayNotes(e.target.value)} rows={2} />
          </div>
          <Button type="button" size="sm" className="w-full" onClick={submitXray}>
            Submit Request
          </Button>

          {workspace.xrayRequests.length > 0 && (
            <ul className="space-y-1 text-xs">
              {workspace.xrayRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded border px-2 py-1">
                  <span>{XRAY_TYPE_LABELS[r.type] ?? r.customType}</span>
                  <Badge variant="outline">{r.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Upload className="h-4 w-4" />
              Attachments
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file, FileCategory.ClinicalPhoto);
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          {[...clinicalPhotos, ...otherFiles].length === 0 ? (
            <p className="text-muted-foreground">No files uploaded</p>
          ) : (
            workspace.files.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded border p-2 hover:bg-muted/50"
              >
                <FileImage className="h-4 w-4 shrink-0" />
                <span className="truncate">{f.originalName}</span>
              </a>
            ))
          )}
        </CardContent>
      </Card>

      {workspace.nextAppointment && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <p className="font-medium">{formatDate(workspace.nextAppointment.date)}</p>
            <p className="text-muted-foreground">
              {workspace.nextAppointment.startTime} – {workspace.nextAppointment.endTime}
            </p>
            {workspace.nextAppointment.chiefComplaint && (
              <p className="mt-1">{workspace.nextAppointment.chiefComplaint}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex items-center justify-between py-3">
          <ConsultationStatusBadge status={workspace.visit.consultationStatus} />
          <AutoSaveIndicator state={autoSaveState} />
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { use } from 'react';

import { ConsultationWorkspacePage } from '@/features/consultation';

export default function ConsultationVisitPage({
  params,
}: {
  params: Promise<{ visitId: string }>;
}) {
  const { visitId } = use(params);
  return <ConsultationWorkspacePage visitId={visitId} />;
}

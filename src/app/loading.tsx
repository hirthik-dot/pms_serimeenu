import { LoadingSkeleton } from '@/components/shared/page-header';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <LoadingSkeleton rows={6} />
    </div>
  );
}

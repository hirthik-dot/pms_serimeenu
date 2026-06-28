import { ConsultationDisplayStatus, VisitStatus } from '@/types/enums';

export function mapVisitToConsultationStatus(
  status: VisitStatus,
  startedAt?: Date | string | null,
): ConsultationDisplayStatus {
  if (status === VisitStatus.Cancelled) {
    return ConsultationDisplayStatus.Cancelled;
  }

  if (status === VisitStatus.Completed || status === VisitStatus.BillingPending) {
    return ConsultationDisplayStatus.Completed;
  }

  if (
    status === VisitStatus.WithDoctor ||
    status === VisitStatus.TreatmentInProgress ||
    startedAt
  ) {
    return ConsultationDisplayStatus.InProgress;
  }

  return ConsultationDisplayStatus.Draft;
}

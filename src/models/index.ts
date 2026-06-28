export { AppointmentModel, APPOINTMENT_POPULATE } from './appointment.model';
export { AuditLogModel, type IAuditLog } from './audit-log.model';
export { BillModel, BILL_POPULATE } from './bill.model';
export { ClinicSettingsModel } from './clinic-settings.model';
export { EmergencyContactModel } from './emergency-contact.model';
export { FileModel, FILE_POPULATE } from './file.model';
export { LoginAttemptModel, type ILoginAttempt } from './login-attempt.model';
export { MedicalHistoryModel } from './medical-history.model';
export { MedicineModel } from './medicine.model';
export { NotificationModel } from './notification.model';
export { PasswordResetTokenModel, type IPasswordResetToken } from './password-reset.model';
export { PatientModel } from './patient.model';
export { PaymentModel, PAYMENT_POPULATE } from './payment.model';
export { PermissionModel } from './permission.model';
export { PrescriptionModel, PRESCRIPTION_POPULATE } from './prescription.model';
export { QueueTokenModel, QUEUE_TOKEN_POPULATE } from './queue-token.model';
export { RefreshTokenModel, type IRefreshToken } from './refresh-token.model';
export { ReportModel } from './report.model';
export { RoleModel, type IRole } from './role.model';
export { SequenceModel, SequenceKey } from './sequence.model';
export { ToothChartModel, TOOTH_CHART_POPULATE } from './tooth-chart.model';
export { ToothConditionModel } from './tooth-condition.model';
export { TreatmentModel } from './treatment.model';
export { TreatmentPlanModel, TREATMENT_PLAN_POPULATE } from './treatment-plan.model';
export { UserModel, type IUser } from './user.model';
export { VisitModel, VISIT_POPULATE } from './visit.model';
export { XRayModel, XRAY_POPULATE } from './xray.model';
export { XrayRequestModel, XRAY_REQUEST_POPULATE } from './xray-request.model';

export * from './base';

export type {
  IAddress,
  IAppointment,
  IAuditContext,
  IAuditLogExtended,
  IBaseFields,
  IBill,
  IBillLineItem,
  IClinicSettings,
  IEmergencyContact,
  IEmergencyContactRecord,
  IFile,
  IMedicalCondition,
  IMedicalHistory,
  IMedicalHabits,
  IMedicine,
  INotification,
  IPatient,
  IPayment,
  IPermission,
  IPrescription,
  IPrescriptionMedication,
  IQueueToken,
  IReport,
  ISequence,
  IThemeSettings,
  IToothChart,
  IToothCondition,
  IToothEntry,
  IToothSurfaceMap,
  IToothTreatmentMapping,
  ITreatment,
  ITreatmentPlan,
  ITreatmentPlanItem,
  IVisit,
  IVisitConsultation,
  IWorkingHours,
  IXRay,
  POPULATE,
} from '@/types/models';

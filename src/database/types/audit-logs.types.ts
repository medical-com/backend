import type { AccountRole } from "./accounts.types";

//public.audit_logs
export interface AuditLog {
	id: string;

	actor_id: string | null;
	actor_type: AuditActorType;
	actor_role: AccountRole | null;

	action: AuditAction;
	outcome: AuditOutcome;

	entity_type: AuditEntityType | null;
	entity_id: string | null;

	changes: AuditChanges | null;
	metadata: Record<string, unknown> | null;

	ip_address: string | null;
	user_agent: string | null;
	request_id: string | null;

	created_at: Date;
}

export enum AuditActorType {
	ACCOUNT = "account",
	ANONYMOUS = "anonymous",
	SYSTEM = "system",
}

export enum AuditOutcome {
	SUCCESS = "success",
	FAILURE = "failure",
}

export enum AuditEntityType {
	ACCOUNT = "account",
	APPOINTMENT = "appointment",
	PATIENT = "patient",
	DOCTOR = "doctor",
	DOCTOR_SCHEDULE = "doctor_schedule",
	MEDICAL_RECORD = "medical_record",
	SERVICE = "service",
}

export enum AuditAction {
	LOGIN = "auth.login",
	LOGOUT = "auth.logout",
	PASSWORD_RESET_REQUESTED = "auth.password_reset_requested",
	PASSWORD_RESET = "auth.password_reset",
	EMAIL_VERIFIED = "auth.email_verified",

	APPOINTMENT_CREATED = "appointment.created",
	APPOINTMENT_RESCHEDULED = "appointment.rescheduled",
	APPOINTMENT_STATUS_CHANGED = "appointment.status_changed",
	APPOINTMENT_CANCELLED = "appointment.cancelled",

	PATIENT_CREATED = "patient.created",
	PATIENT_UPDATED = "patient.updated",

	DOCTOR_CREATED = "doctor.created",
	DOCTOR_UPDATED = "doctor.updated",
	DOCTOR_SCHEDULE_UPDATED = "doctor_schedule.updated",

	MEDICAL_RECORD_CREATED = "medical_record.created",
	MEDICAL_RECORD_UPDATED = "medical_record.updated",
	MEDICAL_RECORD_VIEWED = "medical_record.viewed",

	ACCOUNT_CREATED = "account.created",
	ACCOUNT_ROLE_CHANGED = "account.role_changed",
	ACCOUNT_STATUS_CHANGED = "account.status_changed",

	SERVICE_CREATED = "service.created",
	SERVICE_UPDATED = "service.updated",
	SERVICE_DELETED = "service.deleted",
}

export type AuditChanges = Record<
	string,
	{
		old: unknown;
		new: unknown;
	}
>;

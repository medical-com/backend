export enum AppointmentStatus {
	SCHEDULED = "scheduled",
	CONFIRMED = "confirmed",
	COMPLETED = "completed",
	CANCELLED = "cancelled",
	NO_SHOW = "no_show",
}

export interface Appointment {
	id: string;
	doctor_id: string;
	patient_id: string;
	service_id: string;
	start_at: Date;
	end_at: Date;
	status: AppointmentStatus;
	notes?: string | null;
	created_at: Date;
	updated_at: Date;
}

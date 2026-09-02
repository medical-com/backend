//public.appointments
export type Appointment = {
	id: string;
	patient_id: string;
	doctor_id: string; //account_id of the doctor
	scheduled_at: Date;
	status: AppointmentStatus;
	notes: string | null;
	updated_at: Date;
	created_at: Date;
};

export enum AppointmentStatus {
	SCHEDULED = "scheduled",
	CHECKED_IN = "checked_in",
	COMPLETED = "completed",
	CANCELLED = "cancelled",
}

//public.doctors
export interface Doctor {
	id: string;
	person_id: string;
	license_number: string;
	specialization: string;
	created_at: Date;
	updated_at: Date;
}

//public.doctor_schedules
export interface DoctorSchedule {
	id: string;
	doctor_id: string;
	day_of_week: number; // ISO: 1 = monday, 7 = sunday
	start_time: string; // HH:mm:ss
	end_time: string; // HH:mm:ss
	valid_from: Date;
	valid_to?: Date | null;
	created_at: Date;
	updated_at: Date;
}

//public.doctor_schedules_exceptions
export enum DoctorScheduleExceptionType {
	AVAILABLE = "available",
	UNAVAILABLE = "unavailable",
}
export interface DoctorScheduleException {
	id: string;
	doctor_id: string;
	start_at: Date;
	end_at: Date;
	type: DoctorScheduleExceptionType;
	reason?: string | null;
	created_at: Date;
	updated_at: Date;
}

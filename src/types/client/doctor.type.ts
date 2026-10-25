import type { ClientPerson } from "./person.type";

export interface ClientDoctor extends ClientPerson {
	licenseNumber: string;
	specialization: string;
}

export interface ClientDoctorSchedule {
	id: string;
	doctorId: string;
	dayOfWeek: number; // ISO: 1 = monday, 7 = sunday
	startTime: string; // HH:mm:ss
	endTime: string; // HH:mm:ss
	validFrom: Date;
	validTo?: Date | null;
}
export interface ClientDoctorScheduleException {
	id: string;
	doctorId: string;
	startTime: Date;
	endTime: Date;
	type: string;
	reason: string;
}

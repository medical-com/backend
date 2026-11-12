import type { AppointmentStatus } from "@/database/types";

export type ClientAppointment = {
	id: string;
	startAt: string;
	endAt: string;
	status: AppointmentStatus;
	notes: string | null;
	service: {
		id: string;
		name: string;
		duration: number;
	};
	doctor: {
		id: string;
		firstName: string;
		lastName: string;
		specialization: string;
	};
	patient: {
		id: string;
		firstName: string;
		lastName: string;
		pesel: string;
		email: string;
		phone: string;
		dateOfBirth: string;
	};
};

export type ClientAvailableDate = {
	id: string;
	date: string;
	doctor: {
		id: string;
		firstName: string;
		lastName: string;
	};
	serviceId: string;
	slots: string[];
};

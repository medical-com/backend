import { AppError } from "@/core/errors/app-error";
import {
	appointmentRepository,
	doctorRepository,
	doctorScheduleExceptionRepository,
	doctorScheduleRepository,
	serviceRepository,
} from "@/database/repositories";
import { AppointmentStatus, DoctorScheduleExceptionType } from "@/database/types";
import type { DoctorSchedule, DoctorScheduleException } from "@/database/types";
import type { AvailableDate } from "./types/appointment.schema";

class DashboardAppointmentService {
	async listAvailableDates(data: {
		doctorId: string;
		serviceId: string;
		from?: Date;
		to?: Date;
	}): Promise<AvailableDate[]> {
		return [];
	}
}
export const dashboardAppointmentService = new DashboardAppointmentService();

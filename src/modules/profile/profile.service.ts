import { AppError } from "@/core/errors/app-error";
import { accountRepository, appointmentRepository, patientRepository } from "@/database/repositories";
import { AppointmentStatus } from "@/database/types/appointments.types";
import { ClientAppointment, ClientAppointmentDetailed } from "@/types/client/appointment.type";
import { WithPaginationResponse } from "@/types/pagination.type";

class ProfileService {
	async findOneAppointment(data: {
		accountId: string;
		appointmentId: string;
	}): Promise<ClientAppointmentDetailed | undefined> {
		const appointment = await appointmentRepository.findById({ id: data.appointmentId });
		if (!appointment) throw new AppError("Appointment not found", 404);
		const account = await accountRepository.findById({ id: data.accountId });
		if (!account) throw new AppError("Account not found", 404);
		const patient = await patientRepository.findByPersonId({ personId: account.person_id });
		if (!patient) throw new AppError("Patient not found", 404);
		if (appointment.patient_id !== patient.id)
			throw new AppError("You are not authorized to view this appointment", 403);
		const detailedAppointment = await appointmentRepository.findDetailedById({ id: data.appointmentId });
		if (!detailedAppointment) throw new AppError("Detailed appointment not found", 404);

		const medicalRecord = await appointmentRepository.findMedicalRecordByAppointmentId({
			appointmentId: data.appointmentId,
		});

		return { ...detailedAppointment, medicalRecord };
	}
	async listAppointments(data: {
		accountId: string;
		filters?: { serviceName?: string; from?: Date; to?: Date };
		page?: number;
		limit?: number;
	}): Promise<WithPaginationResponse<ClientAppointment>> {
		const account = await accountRepository.findById({ id: data.accountId });
		if (!account) throw new AppError("Account not found", 404);
		const patient = await patientRepository.findByPersonId({ personId: account.person_id });
		if (!patient) throw new AppError("Patient not found", 404);

		const appointments = await appointmentRepository.listDetailed({
			filters: {
				patientId: patient.id,
				serviceName: data.filters?.serviceName,
				from: data.filters?.from,
				to: data.filters?.to,
			},
			limit: data.limit,
			page: data.page,
		});

		return {
			data: appointments.data,
			pagination: {
				total: appointments.total,
				page: appointments.page,
				limit: appointments.limit,
				totalPages: appointments.totalPages,
				hasNextPage: appointments.hasNextPage,
			},
		};
	}

	async cancelAppointment(data: { accountId: string; appointmentId: string }): Promise<{ success: boolean }> {
		const appointment = await appointmentRepository.findById({ id: data.appointmentId });
		if (!appointment) throw new AppError("Appointment not found", 404);
		const account = await accountRepository.findById({ id: data.accountId });
		if (!account) throw new AppError("Account not found", 404);
		const patient = await patientRepository.findByPersonId({ personId: account.person_id });
		if (!patient) throw new AppError("Patient not found", 404);
		if (appointment.patient_id !== patient.id)
			throw new AppError("You are not authorized to cancel this appointment", 403);
		if (appointment.status !== AppointmentStatus.SCHEDULED)
			throw new AppError("Only scheduled appointments can be canceled", 400);

		await appointmentRepository.updateStatus({
			id: data.appointmentId,
			status: AppointmentStatus.CANCELLED,
			notes: "Appointment canceled by patient",
		});

		return { success: true };
	}
}

export const profileService = new ProfileService();

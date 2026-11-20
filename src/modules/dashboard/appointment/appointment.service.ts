import { AppError } from "@/core/errors/app-error";
import db from "@/database";
import {
	appointmentRepository,
	doctorRepository,
	doctorScheduleExceptionRepository,
	doctorScheduleRepository,
	serviceRepository,
	patientRepository,
	accountRepository,
} from "@/database/repositories";
import { AccountRole, AppointmentStatus, DoctorScheduleExceptionType } from "@/database/types";
import type { Account, Appointment, AppointmentMedicalRecord } from "@/database/types";
import { calendarDate, dayEnd, dayStart, isoDayOfWeek, isBefore, plusDays, plusMinutes, withTime } from "@/core/date";
import type { ClientAppointment, ClientAvailableDate } from "@/types/client/appointment.type";
import type { WithPagination } from "@/types/pagination.type";
import {
	appointmentToTimeIntervals,
	exceptionToTimeIntervals,
	blocksAvailability,
	listAvailableSlots,
	scheduleToTimeIntervals,
} from "./appointment.utils";
import { createPerson } from "@/core/services/person.service";
import { sendAppointmentCreatedEmail } from "@/core/mail/appointment.mail";
import { appointmentReminderQueue } from "./jobs/reminder/reminder.queue";
import { subDays } from "date-fns";
import type { Knex } from "knex";

const MAX_DAYS_IN_ADVANCE = 7;
const APPOINTMENT_QUERY_LIMIT = 100;
const REMINDER_DAYS_BEFORE = [7, 1] as const;

const resolveDateRange = (from?: Date, to?: Date) => {
	const now = new Date();
	const rangeFrom = from && !isBefore(from, now) ? from : now;
	const rangeTo = dayEnd(to ?? plusDays(rangeFrom, MAX_DAYS_IN_ADVANCE));
	if (isBefore(rangeTo, rangeFrom)) throw new AppError("Invalid date range", 400);
	return { rangeFrom, rangeTo };
};

class DashboardAppointmentService {
	async create(data: {
		serviceId: string;
		doctorId: string | null;
		patientId: string | null;
		newPatient?: {
			firstName: string;
			lastName: string;
			email: string;
			phoneNumber: string;
			dateOfBirth: Date;
			pesel: string;
		};
		date: Date;
		time: string;
		notes?: string | null;
	}): Promise<Appointment> {
		const service = await serviceRepository.findById({ id: data.serviceId });
		if (!service) throw new AppError("Service not found", 404);

		const startAt = withTime(data.date, data.time);
		const endAt = plusMinutes(startAt, service.duration);
		const availableDates = await this.listAvailableDates({
			serviceId: data.serviceId,
			doctorId: data.doctorId,
			from: data.date,
			to: data.date,
		});
		const dateKey = calendarDate(data.date);
		const availableDate = availableDates.find((item) => item.date === dateKey && item.slots.includes(data.time));
		if (!availableDate) throw new AppError("The selected time is no longer available", 409);

		return db.transaction(async (trx) => {
			const conflictingAppointments = await appointmentRepository.list(
				{
					filters: { doctorId: availableDate.doctor.id, from: startAt, to: endAt },
					limit: APPOINTMENT_QUERY_LIMIT,
				},
				trx,
			);
			if (conflictingAppointments.data.some(blocksAvailability)) {
				throw new AppError("The selected time is no longer available", 409);
			}

			let patientId = data.patientId;
			if (data.newPatient) {
				const person = await createPerson(
					{
						...data.newPatient,
						phone: data.newPatient.phoneNumber,
					},
					trx,
				);

				const patient = await patientRepository.insert({ person_id: person.id }, trx);

				patientId = patient.id;
			}

			const patient = await patientRepository.findWithPerson({ id: patientId }, trx);
			if (!patient) throw new AppError("Patient not found after creation", 500);

			const appointment = await appointmentRepository.insert(
				{
					doctor_id: availableDate.doctor.id,
					patient_id: patient.id,
					service_id: data.serviceId,
					start_at: startAt,
					end_at: endAt,
					status: AppointmentStatus.SCHEDULED,
					notes: data.notes || null,
				},
				trx,
			);

			await this.sendAppointmentCreatedEmail({ id: appointment.id }, trx);
			await this.setReminder(appointment);

			return appointment;
		});
	}

	async findOne(data: { id: string; account: Account }): Promise<ClientAppointment> {
		const appointment = await appointmentRepository.findDetailedById({ id: data.id });
		if (!appointment) throw new AppError("Appointment not found", 404);
		if (data.account.role === AccountRole.DOCTOR) {
			const account = await accountRepository.findById({ id: data.account.id });
			if (!account) throw new AppError("Account not found", 404);

			const doctor = await doctorRepository.findByPersonId({ personId: account.person_id });
			if (!doctor) throw new AppError("Doctor not found", 404);
			if (appointment.doctor.id !== doctor.id) throw new AppError("Appointment not found", 404);
		}
		return appointment;
	}

	async list(data: {
		account: Account;
		filters?: {
			doctorId?: string;
			serviceId?: string;
			from?: Date;
			to?: Date;
			patientName?: string;
			patientEmail?: string;
			patientPhone?: string;
			patientPesel?: string;
			status?: AppointmentStatus;
		};
		page?: number;
		limit?: number;
	}): Promise<WithPagination<ClientAppointment>> {
		if (data.account.role === AccountRole.DOCTOR) {
			const account = await accountRepository.findById({ id: data.account.id });
			if (!account) throw new AppError("Account not found", 404);

			const doctor = await doctorRepository.findByPersonId({ personId: account.person_id });
			if (!doctor) throw new AppError("Doctor not found", 404);
			data.filters = { ...data.filters, doctorId: doctor.id };
		}

		return appointmentRepository.listDetailed(data);
	}

	async listAvailableDates(data: {
		serviceId: string;
		doctorId: string | null;
		from?: Date;
		to?: Date;
	}): Promise<ClientAvailableDate[]> {
		const service = await serviceRepository.findById({ id: data.serviceId });
		if (!service) throw new AppError("Service not found", 404);

		const doctorIds = data.doctorId ? [data.doctorId] : service.doctor_ids;
		if (data.doctorId && !service.doctor_ids.includes(data.doctorId))
			throw new AppError("Doctor cannot perform this service", 400);

		const { rangeFrom, rangeTo } = resolveDateRange(data.from, data.to);

		const doctors = await Promise.all(doctorIds.map((doctorId) => doctorRepository.findWithPerson({ doctorId })));

		const availableDates: ClientAvailableDate[] = [];
		for (const doctor of doctors) {
			if (!doctor) continue;

			const dates = await this.listAvailableDatesForDoctor({
				serviceId: data.serviceId,
				doctorId: doctor.id,
				from: rangeFrom,
				to: rangeTo,
			});
			availableDates.push(...dates);
		}

		return availableDates;
	}

	async listAvailableDatesForDoctor(data: {
		serviceId: string;
		doctorId: string;
		from?: Date;
		to?: Date;
	}): Promise<ClientAvailableDate[]> {
		const doctor = await doctorRepository.findWithPerson({ doctorId: data.doctorId });
		if (!doctor) throw new AppError("Doctor not found", 404);
		const service = await serviceRepository.findById({ id: data.serviceId });
		if (!service) throw new AppError("Doctor has no services", 404);

		if (!service.doctor_ids.includes(data.doctorId)) throw new AppError("Doctor cannot perform this service", 400);

		const { rangeFrom, rangeTo } = resolveDateRange(data.from, data.to);

		const [schedules, exceptions, appointments] = await Promise.all([
			doctorScheduleRepository.findByDoctorAndDateRange({
				doctorId: doctor.id,
				from: rangeFrom,
				to: rangeTo,
			}),
			doctorScheduleExceptionRepository.findByDoctorAndDateRange({
				doctorId: doctor.id,
				from: rangeFrom,
				to: rangeTo,
			}),
			appointmentRepository.list({
				filters: {
					doctorId: doctor.id,
					from: rangeFrom,
					to: rangeTo,
				},
				limit: APPOINTMENT_QUERY_LIMIT,
			}),
		]);

		const availableDates: ClientAvailableDate[] = [];
		for (let date = dayStart(rangeFrom); !isBefore(rangeTo, date); date = plusDays(date, 1)) {
			const schedule = schedules.find(
				(item) =>
					item.day_of_week === isoDayOfWeek(date) &&
					!isBefore(date, dayStart(item.valid_from)) &&
					(!item.valid_to || !isBefore(dayStart(item.valid_to), date)),
			);
			const dateKey = calendarDate(date);
			const dayExceptions = exceptions.filter(
				(item) => calendarDate(item.start_at) <= dateKey && calendarDate(item.end_at) >= dateKey,
			);

			const slots = listAvailableSlots(
				schedule ? [scheduleToTimeIntervals(schedule)] : [],
				dayExceptions
					.filter((exception) => exception.type === DoctorScheduleExceptionType.AVAILABLE)
					.map((exception) => exceptionToTimeIntervals(exception, date)),
				dayExceptions
					.filter((exception) => exception.type === DoctorScheduleExceptionType.UNAVAILABLE)
					.map((exception) => exceptionToTimeIntervals(exception, date)),
				appointments.data
					.filter(blocksAvailability)
					.filter(
						(appointment) =>
							isBefore(appointment.start_at, dayEnd(date)) &&
							isBefore(dayStart(date), appointment.end_at),
					)
					.map((appointment) => appointmentToTimeIntervals(appointment, date)),
				service.duration,
			).filter((slot) => !isBefore(withTime(date, slot), rangeFrom));

			if (slots.length > 0) {
				availableDates.push({
					id: `${doctor.id}-${dateKey}`,
					date: dateKey,
					doctor: {
						id: doctor.id,
						firstName: doctor.person.first_name,
						lastName: doctor.person.last_name,
					},
					serviceId: data.serviceId,
					slots,
				});
			}
		}

		return availableDates;
	}

	async createMedicalRecord(data: {
		appointmentId: string;
		diagnosis: string;
		prescription: string;
		account: Account;
	}): Promise<AppointmentMedicalRecord> {
		const appointment = await this.ensureAppointmentAccess(data.appointmentId, data.account);
		if (!appointment) throw new AppError("Appointment not found", 404);

		const existing = await appointmentRepository.findMedicalRecordByAppointmentId({
			appointmentId: data.appointmentId,
		});
		if (existing) throw new AppError("Medical record already exists for this appointment", 409);
		if (isBefore(new Date(), appointment.start_at))
			throw new AppError("Cannot create medical record for an appointment that has not started", 400);
		if (appointment.status !== AppointmentStatus.CONFIRMED)
			throw new AppError("Cannot create medical record for an appointment that is not completed", 400);

		return appointmentRepository.insertMedicalRecord({
			appointment_id: data.appointmentId,
			diagnosis: data.diagnosis,
			prescription: data.prescription,
		});
	}

	async updateMedicalRecord(data: {
		id: string;
		diagnosis?: string;
		prescription?: string;
		account: Account;
	}): Promise<AppointmentMedicalRecord> {
		const record = await appointmentRepository.findMedicalRecordById({ id: data.id });
		if (!record) throw new AppError("Medical record not found", 404);

		await this.ensureAppointmentAccess(record.appointment_id, data.account);

		return appointmentRepository.updateMedicalRecord({
			id: record.id,
			update: Object.fromEntries(
				Object.entries({
					diagnosis: data.diagnosis,
					prescription: data.prescription,
				}).filter(([, value]) => value !== undefined),
			),
		});
	}

	async findOneMedicalRecord(data: { appointmentId: string; account: Account }): Promise<AppointmentMedicalRecord> {
		await this.ensureAppointmentAccess(data.appointmentId, data.account);

		const record = await appointmentRepository.findMedicalRecordByAppointmentId({
			appointmentId: data.appointmentId,
		});
		if (!record) throw new AppError("Medical record not found", 404);

		return record;
	}

	async listMedicalRecords(data: {
		account: Account;
		page?: number;
		limit?: number;
	}): Promise<WithPagination<AppointmentMedicalRecord>> {
		let doctorId: string | undefined;

		if (data.account.role === AccountRole.DOCTOR) {
			const account = await accountRepository.findById({ id: data.account.id });
			if (!account) throw new AppError("Account not found", 404);

			const doctor = await doctorRepository.findByPersonId({ personId: account.person_id });
			if (!doctor) throw new AppError("Doctor not found", 404);
			doctorId = doctor.id;
		}

		return appointmentRepository.listMedicalRecords({
			doctorId,
			page: data.page,
			limit: data.limit,
		});
	}

	async updateStatus(data: { id: string; status: AppointmentStatus; account: Account }): Promise<ClientAppointment> {
		const appointment = await appointmentRepository.findById({ id: data.id });
		if (!appointment) throw new AppError("Appointment not found", 404);
		if (data.account.role === AccountRole.DOCTOR) {
			const account = await accountRepository.findById({ id: data.account.id });
			if (!account) throw new AppError("Account not found", 404);

			const doctor = await doctorRepository.findByPersonId({ personId: account.person_id });
			if (!doctor) throw new AppError("Doctor not found", 404);
			if (appointment.doctor_id !== doctor.id) throw new AppError("Appointment not found", 404);
		}

		await appointmentRepository.updateStatus({ id: data.id, status: data.status });

		const updatedAppointment = await appointmentRepository.findDetailedById({ id: data.id });
		if (!updatedAppointment) throw new AppError("Appointment not found after update", 404);

		if (data.status === AppointmentStatus.CANCELLED)
			await appointmentReminderQueue.cancel({ appointmentId: data.id });

		return updatedAppointment;
	}

	private async ensureAppointmentAccess(appointmentId: string, account: Account): Promise<Appointment | null> {
		const appointment = await appointmentRepository.findById({ id: appointmentId });
		if (!appointment) throw new AppError("Appointment not found", 404);

		if (account.role === AccountRole.DOCTOR) {
			const accountRow = await accountRepository.findById({ id: account.id });
			if (!accountRow) throw new AppError("Account not found", 404);

			const doctor = await doctorRepository.findByPersonId({ personId: accountRow.person_id });
			if (!doctor) throw new AppError("Doctor not found", 404);
			if (appointment.doctor_id !== doctor.id) throw new AppError("Appointment not found", 404);

			return appointment;
		}

		return null;
	}

	private async sendAppointmentCreatedEmail(data: { id: string }, trx?: Knex.Transaction) {
		const appointment = await appointmentRepository.findDetailedById({ id: data.id }, trx);
		if (!appointment) throw new AppError("Appointment not found", 404);

		await sendAppointmentCreatedEmail({
			firstName: appointment.patient.firstName,
			lastName: appointment.patient.lastName,
			email: appointment.patient.email,
			date: new Date(appointment.startAt),
			serviceName: appointment.service.name,
			duration: appointment.service.duration,
			doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
		});
	}

	private async setReminder(appointment: Appointment) {
		const now = new Date();

		for (const daysBefore of REMINDER_DAYS_BEFORE) {
			const reminderTime = subDays(appointment.start_at, daysBefore);

			if (reminderTime <= now) continue;

			await appointmentReminderQueue.add({
				appointmentId: appointment.id,
				reminderTime,
			});
		}
	}
}
export const dashboardAppointmentService = new DashboardAppointmentService();

import { AppError } from "@/core/errors/app-error";
import db from "@/database";
import {
	appointmentRepository,
	doctorRepository,
	doctorScheduleExceptionRepository,
	doctorScheduleRepository,
	serviceRepository,
	patientRepository,
	personRepository,
} from "@/database/repositories";
import { AppointmentStatus, DoctorScheduleExceptionType } from "@/database/types";
import type { Appointment } from "@/database/types";
import {
	calendarDate,
	dayEnd,
	dayStart,
	isoDayOfWeek,
	isBefore,
	plusDays,
	plusMinutes,
	timeString,
	withTime,
} from "@/core/date";
import type { CreateAppointment } from "./types/appointment.schema";
import type { ClientAppointment, ClientAvailableDate } from "@/types/client/appointment.type";
import type { WithPagination } from "@/types/pagination.type";
import {
	appointmentToTimeIntervals,
	exceptionToTimeIntervals,
	listAvailableTimeIntervals,
	scheduleToTimeIntervals,
} from "./appointment.utils";

const MAX_DAYS_IN_ADVANCE = 7;
class DashboardAppointmentService {
	async create(data: CreateAppointment): Promise<Appointment> {
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
					limit: 100,
				},
				trx,
			);
			if (
				conflictingAppointments.data.some(
					(appointment) =>
						appointment.status !== AppointmentStatus.CANCELLED &&
						appointment.status !== AppointmentStatus.NO_SHOW,
				)
			) {
				throw new AppError("The selected time is no longer available", 409);
			}

			let patientId = data.patientId;
			if (data.newPatient) {
				const [existingPesel, existingEmail, existingPhone] = await Promise.all([
					personRepository.findByPesel({ pesel: data.newPatient.pesel }, trx),
					personRepository.findByEmail({ email: data.newPatient.email }, trx),
					personRepository.findByPhone({ phone: data.newPatient.phoneNumber }, trx),
				]);
				if (existingPesel) throw new AppError("PESEL already exists", 409);
				if (existingEmail) throw new AppError("Email already exists", 409);
				if (existingPhone) throw new AppError("Phone number already exists", 409);

				const person = await personRepository.insert(
					{
						first_name: data.newPatient.firstName,
						last_name: data.newPatient.lastName,
						email: data.newPatient.email,
						phone: data.newPatient.phoneNumber,
						date_of_birth: data.newPatient.dateOfBirth,
						pesel: data.newPatient.pesel,
					},
					trx,
				);
				const patient = await patientRepository.insert({ person_id: person.id }, trx);
				patientId = patient.id;
			} else if (!patientId || !(await patientRepository.findWithPerson({ id: patientId }, trx))) {
				throw new AppError("Patient not found", 404);
			}

			return appointmentRepository.insert(
				{
					doctor_id: availableDate.doctor.id,
					patient_id: patientId,
					service_id: data.serviceId,
					start_at: startAt,
					end_at: endAt,
					status: AppointmentStatus.SCHEDULED,
					notes: data.notes || null,
				},
				trx,
			);
		});
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

		const rangeFrom = dayStart(data.from ?? new Date());
		const rangeTo = dayEnd(data.to ?? plusDays(rangeFrom, MAX_DAYS_IN_ADVANCE));
		if (isBefore(rangeTo, rangeFrom)) throw new AppError("Invalid date range", 400);

		const doctors = await Promise.all(doctorIds.map((doctorId) => doctorRepository.findWithPerson({ doctorId })));

		const availableDates: ClientAvailableDate[] = [];
		for (const doctor of doctors) {
			if (!doctor) continue;

			await this.listAvailableDatesForDoctor({
				serviceId: data.serviceId,
				doctorId: doctor.id,
				from: rangeFrom,
				to: rangeTo,
			}).then((dates) => availableDates.push(...dates));
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

		const rangeFrom = dayStart(data.from ?? new Date());
		const rangeTo = dayEnd(data.to ?? plusDays(rangeFrom, MAX_DAYS_IN_ADVANCE));
		if (isBefore(rangeTo, rangeFrom)) throw new AppError("Invalid date range", 400);

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
				limit: 100,
			}),
		]);

		const availableDates: ClientAvailableDate[] = [];
		for (let date = rangeFrom; !isBefore(rangeTo, date); date = plusDays(date, 1)) {
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

			const { timeIntervals } = listAvailableTimeIntervals(
				schedule ? [scheduleToTimeIntervals(schedule)] : [],
				dayExceptions
					.filter((exception) => exception.type === DoctorScheduleExceptionType.AVAILABLE)
					.map((exception) => exceptionToTimeIntervals(exception, date)),
				dayExceptions
					.filter((exception) => exception.type === DoctorScheduleExceptionType.UNAVAILABLE)
					.map((exception) => exceptionToTimeIntervals(exception, date)),
				appointments.data
					.filter(
						(appointment) =>
							appointment.status !== AppointmentStatus.CANCELLED &&
							appointment.status !== AppointmentStatus.NO_SHOW,
					)
					.filter(
						(appointment) =>
							isBefore(appointment.start_at, dayEnd(date)) &&
							isBefore(dayStart(date), appointment.end_at),
					)
					.map((appointment) => appointmentToTimeIntervals(appointment, date)),
			);

			const slots = timeIntervals
				.flatMap(({ start, end }) => {
					const intervalSlots: string[] = [];
					const [startHours = 0, startMinutes = 0] = start.split(":").map(Number);
					const [endHours = 0, endMinutes = 0] = end.split(":").map(Number);
					const intervalStart = startHours * 60 + startMinutes;
					const intervalEnd = endHours * 60 + endMinutes;
					for (let slot = intervalStart; slot + service.duration <= intervalEnd; slot += service.duration) {
						intervalSlots.push(
							`${String(Math.floor(slot / 60)).padStart(2, "0")}:${String(slot % 60).padStart(2, "0")}`,
						);
					}
					return intervalSlots;
				})
				.filter((slot, index, allSlots) => allSlots.indexOf(slot) === index);

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

	async list(data: {
		filters?: { doctorId?: string; serviceId?: string; from?: Date; to?: Date; patientName?: string };
		page?: number;
		limit?: number;
	}): Promise<WithPagination<ClientAppointment>> {
		return await appointmentRepository.listDetailed(data);
	}

	async findOne(id: string): Promise<ClientAppointment> {
		const appointment = await appointmentRepository.findDetailedById({ id });
		if (!appointment) throw new AppError("Appointment not found", 404);
		return appointment;
	}
}
export const dashboardAppointmentService = new DashboardAppointmentService();

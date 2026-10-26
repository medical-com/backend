import { randomUUID } from "node:crypto";

import db from "@/database";
import redis from "@/core/redis";

import { AppError } from "@/core/errors/app-error";
import { generateRandomPassword, hashPassword } from "@/core/security/password";
import {
	accountRepository,
	doctorRepository,
	doctorScheduleRepository,
	doctorScheduleExceptionRepository,
	personRepository,
} from "@/database/repositories";
import {
	AccountRole,
	AccountStatus,
	Doctor,
	DoctorSchedule,
	DoctorScheduleException,
	DoctorScheduleExceptionType,
	Person,
} from "@/database/types";
import { mailService } from "@/core/mail";
import type { ClientDoctor } from "@/types/client/doctor.type";
import type { WithPagination } from "@/types/pagination.type";
import type { ClientDoctorSchedule, ClientDoctorScheduleException } from "@/types/client/doctor.type";

class DashboardDoctorService {
	async findOne(id: string): Promise<ClientDoctor | null> {
		const doctor = await doctorRepository.findWithPerson({ doctorId: id });

		if (!doctor) throw new AppError("Doctor not found", 404);

		return this.toClientDoctor(doctor);
	}

	async list(data: {
		filters: { firstName?: string; lastName?: string };
		page?: number;
		limit?: number;
	}): Promise<WithPagination<ClientDoctor>> {
		const result = await doctorRepository.listWithPerson({
			filters: {
				first_name: data.filters.firstName,
				last_name: data.filters.lastName,
			},
			page: data.page ?? 1,
			limit: data.limit ?? 10,
		});

		return {
			data: result.data.map((doctor) => this.toClientDoctor(doctor)),
			total: result.total,
			page: result.page,
			limit: result.limit,
			totalPages: result.totalPages,
			hasNextPage: result.hasNextPage,
		};
	}

	async update(data: {
		id: string;
		update: {
			firstName?: string;
			lastName?: string;
			email?: string;
			phoneNumber?: string;
			dateOfBirth?: Date;
			pesel?: string;
			licenseNumber?: string;
			specialization?: string;
		};
	}): Promise<ClientDoctor> {
		const doctor = await doctorRepository.findWithPerson({ doctorId: data.id });
		if (!doctor) throw new AppError("Doctor not found", 404);

		const { firstName, lastName, email, phoneNumber, dateOfBirth, pesel, licenseNumber, specialization } =
			data.update;

		const updatedDoctor = await db.transaction(async (trx) => {
			await personRepository.validateAndUpdate(
				{
					id: doctor.person_id,
					update: {
						date_of_birth: dateOfBirth ? new Date(dateOfBirth) : undefined,
						email,
						first_name: firstName,
						last_name: lastName,
						phone: phoneNumber,
						pesel,
					},
				},
				trx,
			);
			const doctorWithLicenseNumber = await doctorRepository.findByLicenseNumber(
				{ licenseNumber: data.update.licenseNumber ?? "" },
				trx,
			);
			if (doctorWithLicenseNumber && doctorWithLicenseNumber.id !== doctor.id)
				throw new AppError("Doctor with this license number already exists", 400);

			await doctorRepository.update(
				{
					id: doctor.id,
					update: {
						license_number: licenseNumber,
						specialization,
					},
				},
				trx,
			);

			const result = await doctorRepository.findWithPerson({ doctorId: doctor.id }, trx);
			if (!result) throw new AppError("Doctor not found after update", 404);
			return result;
		});

		return this.toClientDoctor(updatedDoctor);
	}

	async create(data: {
		firstName: string;
		lastName: string;
		pesel: string;
		email: string;
		phoneNumber: string;
		dateOfBirth: Date;
		licenseNumber: string;
		specialization: string;
	}): Promise<boolean> {
		await db.transaction(async (trx) => {
			const personWithPeselExists = await personRepository.findByPesel({ pesel: data.pesel }, trx);
			if (personWithPeselExists) throw new Error("Person with this pesel already exists");
			const personWithEmailExists = await personRepository.findByEmail({ email: data.email }, trx);
			if (personWithEmailExists) throw new Error("Person with this email already exists");
			const personWithPhoneExists = await personRepository.findByPhone({ phone: data.phoneNumber }, trx);
			if (personWithPhoneExists) throw new Error("Person with this phone number already exists");
			const doctorWithLicenseExists = await doctorRepository.findByLicenseNumber(
				{ licenseNumber: data.licenseNumber },
				trx,
			);
			if (doctorWithLicenseExists) throw new AppError("Doctor with this license number already exists", 400);

			const person = await personRepository.insert(
				{
					first_name: data.firstName,
					last_name: data.lastName,
					email: data.email,
					phone: data.phoneNumber,
					pesel: data.pesel,
					date_of_birth: new Date(data.dateOfBirth),
				},
				trx,
			);

			const temporaryPassword = generateRandomPassword();
			const account = await accountRepository.insert(
				{
					person_id: person.id,
					email: data.email,
					email_verified: false,
					password_hash: await hashPassword(temporaryPassword),
					role: AccountRole.DOCTOR,
					status: AccountStatus.INVITED,
				},
				trx,
			);
			const token = await this.createDoctorInvitationToken({
				accountId: account.id,
				licenseNumber: data.licenseNumber,
				specialization: data.specialization,
			});
			await mailService.sendDoctorInvitation({ ...data, email: person.email, token, temporaryPassword });
		});

		return true;
	}

	async createDoctorInvitationToken(data: {
		accountId: string;
		licenseNumber: string;
		specialization: string;
	}): Promise<string> {
		const token = randomUUID();
		await redis.set(`doctor_invitation_token:${token}`, JSON.stringify(data), "EX", 60 * 60);
		return token;
	}

	async confirmDoctorInvitation(data: { token: string }): Promise<boolean> {
		const invitation = await redis.get(`doctor_invitation_token:${data.token}`);
		if (!invitation) throw new AppError("Invalid or expired doctor invitation", 400);

		const { accountId, licenseNumber, specialization } = JSON.parse(invitation);

		await db.transaction(async (trx) => {
			const account = await accountRepository.findById({ id: accountId }, trx);
			if (!account) throw new AppError("Account not found", 404);
			if (account.status === AccountStatus.ACTIVE) return;
			if (account.status !== AccountStatus.INVITED)
				throw new AppError("Doctor invitation is no longer active", 400);

			const person = await personRepository.findById({ id: account.person_id }, trx);
			if (!person) throw new AppError("Person not found", 404);

			const doctorWithLicenseExists = await doctorRepository.findByLicenseNumber({ licenseNumber }, trx);
			if (doctorWithLicenseExists) throw new AppError("Doctor with this license number already exists", 400);

			await doctorRepository.insert({ person_id: person.id, license_number: licenseNumber, specialization }, trx);
			await accountRepository.updateEmailVerified({ id: account.id, emailVerified: true }, trx);
			await accountRepository.updateStatus({ id: account.id, status: AccountStatus.ACTIVE }, trx);
		});

		await redis.del(`doctor_invitation_token:${data.token}`);
		return true;
	}

	async createSchedule(data: {
		doctorId: string;
		dayOfWeek: number;
		startTime: string;
		endTime: string;
		validFrom: Date;
		validTo?: Date | null;
	}): Promise<ClientDoctorSchedule> {
		await this.ensureDoctorExists(data.doctorId);
		await this.ensureDoctorHasNoScheduleForDay(data.doctorId, data.dayOfWeek);
		const schedule = await doctorScheduleRepository.insert({
			doctor_id: data.doctorId,
			day_of_week: data.dayOfWeek,
			start_time: data.startTime,
			end_time: data.endTime,
			valid_from: data.validFrom,
			valid_to: data.validTo ?? null,
		});
		return this.toClientDoctorSchedule(schedule);
	}

	async updateSchedule(data: {
		id: string;
		doctorId?: string;
		dayOfWeek?: number;
		startTime?: string;
		endTime?: string;
		validFrom?: Date;
		validTo?: Date | null;
	}): Promise<ClientDoctorSchedule> {
		const existing = await doctorScheduleRepository.findById({ id: data.id });
		if (!existing) throw new AppError("Doctor schedule not found", 404);

		const doctorId = data.doctorId ?? existing.doctor_id;
		const dayOfWeek = data.dayOfWeek ?? existing.day_of_week;
		await this.ensureDoctorHasNoScheduleForDay(doctorId, dayOfWeek, data.id);

		const update = {
			doctor_id: data.doctorId,
			day_of_week: data.dayOfWeek,
			start_time: data.startTime,
			end_time: data.endTime,
			valid_from: data.validFrom,
			valid_to: data.validTo,
		};
		if (data.doctorId) await this.ensureDoctorExists(data.doctorId);

		const schedule = await doctorScheduleRepository.update({
			id: data.id,
			update: Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined)),
		});
		return this.toClientDoctorSchedule(schedule);
	}

	async listSchedules(data: {
		filters: { doctorId?: string; doctorName?: string };
		page?: number;
		limit?: number;
	}): Promise<WithPagination<ClientDoctorSchedule>> {
		const result = await doctorScheduleRepository.list(data);
		return {
			...result,
			data: result.data.map((schedule) => this.toClientDoctorSchedule(schedule)),
		};
	}

	async createScheduleException(data: {
		doctorId: string;
		startAt: Date;
		endAt: Date;
		type: DoctorScheduleExceptionType;
		reason?: string | null;
	}): Promise<ClientDoctorScheduleException> {
		await this.ensureDoctorExists(data.doctorId);
		const exception = await doctorScheduleExceptionRepository.insert({
			doctor_id: data.doctorId,
			start_at: data.startAt,
			end_at: data.endAt,
			type: data.type,
			reason: data.reason ?? null,
		});
		return this.toClientDoctorScheduleException(exception);
	}

	async updateScheduleException(data: {
		id: string;
		doctorId?: string;
		startAt?: Date;
		endAt?: Date;
		type?: DoctorScheduleExceptionType;
		reason?: string | null;
	}): Promise<ClientDoctorScheduleException> {
		const existing = await doctorScheduleExceptionRepository.findById({ id: data.id });
		if (!existing) throw new AppError("Doctor schedule exception not found", 404);

		const doctorId = data.doctorId ?? existing.doctor_id;
		const startAt = data.startAt ?? existing.start_at;
		const endAt = data.endAt ?? existing.end_at;
		if (data.doctorId) await this.ensureDoctorExists(data.doctorId);
		if (startAt >= endAt) throw new AppError("Start date-time must be before end date-time", 400);

		const exception = await doctorScheduleExceptionRepository.update({
			id: data.id,
			update: Object.fromEntries(
				Object.entries({
					doctor_id: data.doctorId,
					start_at: data.startAt,
					end_at: data.endAt,
					type: data.type,
					reason: data.reason,
				}).filter(([, value]) => value !== undefined),
			),
		});
		if (exception.doctor_id !== doctorId) throw new AppError("Doctor not found", 404);
		return this.toClientDoctorScheduleException(exception);
	}

	async deleteScheduleException(data: { id: string }): Promise<boolean> {
		const existing = await doctorScheduleExceptionRepository.findById({ id: data.id });
		if (!existing) throw new AppError("Doctor schedule exception not found", 404);
		return doctorScheduleExceptionRepository.delete({ id: data.id });
	}

	async listScheduleExceptions(data: {
		doctorId: string;
		page?: number;
		limit?: number;
	}): Promise<WithPagination<ClientDoctorScheduleException>> {
		await this.ensureDoctorExists(data.doctorId);
		const result = await doctorScheduleExceptionRepository.list(data);
		return {
			...result,
			data: result.data.map((exception) => this.toClientDoctorScheduleException(exception)),
		};
	}

	private async ensureDoctorExists(id: string): Promise<void> {
		const doctor = await doctorRepository.findWithPerson({ doctorId: id });
		if (!doctor) throw new AppError("Doctor not found", 404);
	}

	private async ensureDoctorHasNoScheduleForDay(
		doctorId: string,
		dayOfWeek: number,
		excludeId?: string,
	): Promise<void> {
		const schedule = await doctorScheduleRepository.findByDoctorAndDay({
			doctorId,
			dayOfWeek,
			excludeId,
		});
		if (schedule) throw new AppError("Doctor already has a schedule for this day", 400);
	}

	private toClientDoctor(doctor: Doctor & { person: Person }): ClientDoctor {
		return {
			id: doctor.id,
			licenseNumber: doctor.license_number,
			specialization: doctor.specialization,
			firstName: doctor.person.first_name,
			lastName: doctor.person.last_name,
			pesel: doctor.person.pesel,
			email: doctor.person.email,
			phone: doctor.person.phone,
			dateOfBirth: doctor.person.date_of_birth,
		};
	}

	private toClientDoctorSchedule(schedule: DoctorSchedule): ClientDoctorSchedule {
		return {
			id: schedule.id,
			doctorId: schedule.doctor_id,
			dayOfWeek: schedule.day_of_week,
			startTime: schedule.start_time,
			endTime: schedule.end_time,
			validFrom: schedule.valid_from,
			validTo: schedule.valid_to ?? null,
		};
	}

	private toClientDoctorScheduleException(exception: DoctorScheduleException): ClientDoctorScheduleException {
		return {
			id: exception.id,
			doctorId: exception.doctor_id,
			startAt: exception.start_at,
			endAt: exception.end_at,
			type: exception.type,
			reason: exception.reason ?? null,
		};
	}
}

export const dashboardDoctorService = new DashboardDoctorService();

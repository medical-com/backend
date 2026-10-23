import db from "@/database";
import redis from "@/core/redis";

import { AppError } from "@/core/errors/app-error";
import { hashPassword, randomPassword } from "@/core/security/password";
import { accountRepository, doctorRepository, personRepository } from "@/database/repositories";
import { AccountRole, AccountStatus, Doctor, Person } from "@/database/types";
import type { ClientDoctor } from "@/types/client/doctor.type";
import type { WithPagination } from "@/types/pagination.type";
import type { Knex } from "knex";

class DashboardDoctorService {
	async make(data: { personId: string; licenseNumber: string; specialization: string }): Promise<ClientDoctor> {
		const doctor = await db.transaction(async (trx) => {
			const person = await personRepository.findById({ id: data.personId }, trx);
			if (!person) throw new AppError("Person not found", 404);

			await accountRepository.updateRole({ id: person.id, role: AccountRole.DOCTOR }, trx);

			const created = await doctorRepository.insert(
				{
					person_id: person.id,
					license_number: data.licenseNumber,
					specialization: data.specialization,
				},
				trx,
			);

			const doctor = await doctorRepository.findWithPerson({ doctorId: created.id }, trx);
			if (!doctor) throw new AppError("Doctor not found", 404);

			return doctor;
		});

		return this.toClientDoctor(doctor);
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
		const _doctor = await db.transaction(async (trx) => {
			const personWithPeselExists = await personRepository.findByPesel({ pesel: data.pesel }, trx);
			if (personWithPeselExists) throw new Error("Person with this pesel already exists");
			const personWithEmailExists = await personRepository.findByEmail({ email: data.email }, trx);
			if (personWithEmailExists) throw new Error("Person with this email already exists");
			const personWithPhoneExists = await personRepository.findByPhone({ phone: data.phoneNumber }, trx);
			if (personWithPhoneExists) throw new Error("Person with this phone number already exists");

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

			const password = await randomPassword();
			const hashedPassword = await hashPassword(password);
			await accountRepository.insert(
				{
					person_id: person.id,
					email: data.email,
					email_verified: false,
					password_hash: hashedPassword,
					role: AccountRole.DOCTOR,
					status: AccountStatus.INVITED,
				},
				trx,
			);

			const created = await doctorRepository.insert(
				{
					person_id: person.id,
					license_number: data.licenseNumber,
					specialization: data.specialization,
				},
				trx,
			);

			return created;
		});

		//send email with password to doctor.email here and link to activate account

		return true;
	}

	async createEmailVerificationToken(data: { accountId: string }, trx?: Knex.Transaction): Promise<string> {
		const account = await accountRepository.findById({ id: data.accountId }, trx);
		if (!account) throw new AppError("Account not found", 404);
		if (account.email_verified) throw new AppError("Email is already verified", 400);

		const token = Math.floor(100000 + Math.random() * 900000).toString();
		await redis.set(`email_verification_token:${token}`, account.id, "EX", 60 * 60); // 1 hour expiration

		return token;
	}

	async confirmEmail(data: { token: string }): Promise<boolean> {
		const accountId = await redis.get(`email_verification_token:${data.token}`);
		if (!accountId) throw new AppError("Invalid or expired verification token", 400);

		const account = await accountRepository.findById({ id: accountId });
		if (!account) throw new AppError("Account not found", 404);
		if (account.email_verified) throw new AppError("Email is already verified", 400);

		await redis.del(`email_verification_token:${data.token}`);

		const result = await accountRepository.updateEmailVerified({ id: account.id, emailVerified: true });

		return !!result;
	}

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
}

export const dashboardDoctorService = new DashboardDoctorService();

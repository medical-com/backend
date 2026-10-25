import { randomUUID } from "node:crypto";

import db from "@/database";
import redis from "@/core/redis";

import { AppError } from "@/core/errors/app-error";
import { generateRandomPassword, hashPassword } from "@/core/security/password";
import { accountRepository, doctorRepository, personRepository } from "@/database/repositories";
import { AccountRole, AccountStatus, Doctor, Person } from "@/database/types";
import { mailService } from "@/core/mail";
import type { ClientDoctor } from "@/types/client/doctor.type";
import type { WithPagination } from "@/types/pagination.type";

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
			if (
				data.update.licenseNumber &&
				(await doctorRepository.findByLicenseNumber({ licenseNumber: data.update.licenseNumber }, trx))
			) {
				throw new AppError("Doctor with this license number already exists", 400);
			}

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

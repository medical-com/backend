import AccountRepository from "@/database/repositories/account.repository";

import { AppError } from "@/core/errors/app-error";
import { hashPassword, verifyPassword } from "@/core/security/password";
import { createSession, destroySession } from "../../core/security/session.store";
import { Account, AccountGroup } from "@/database/types";
import PatientRepository from "@/database/repositories/patient.repository";

export default class AuthService {
	constructor(
		readonly accountRepository: AccountRepository,
		readonly patientRepository: PatientRepository,
	) {}

	async register(data: {
		firstName: string;
		lastName: string;
		email: string;
		dateOfBirth: string;
		phoneNumber: string;
		password: string;
	}) {
		const existingAccount = await this.accountRepository.findByEmail({ email: data.email });
		if (existingAccount) throw new AppError("Account with this email already exists", 400);

		let patient = await this.patientRepository.findByEmail({ email: data.email });
		if (!patient) {
			patient = await this.patientRepository.insert({
				first_name: data.firstName,
				last_name: data.lastName,
				date_of_birth: data.dateOfBirth,
				phone_number: data.phoneNumber,
				email: data.email,
			});
		} else {
			if (
				patient.first_name !== data.firstName ||
				patient.last_name !== data.lastName ||
				patient.email !== data.email ||
				patient.phone_number !== data.phoneNumber ||
				patient.date_of_birth !== data.dateOfBirth
			) {
				throw new AppError("Patient with this email already exists with different name", 400);
			}
		}

		const passwordHash = await hashPassword(data.password);
		const account = await this.accountRepository.insert({
			patient_id: patient.id,
			email: data.email,
			email_verified: false,
			password_hash: passwordHash,
			group: AccountGroup.PATIENT,
		});

		return account;
	}

	async login(data: { email: string; password: string }): Promise<{ account: Account; sessionId: string }> {
		const account = await this.accountRepository.findByEmail({ email: data.email });
		if (!account || !(await verifyPassword(data.password, account.password_hash)))
			throw new AppError("Invalid email or password", 401);

		await this.accountRepository.updateLastLoginAt({ id: account.id });

		const sessionId = await createSession(account.id);

		return { account, sessionId };
	}

	async logout(data: { sessionId: string }): Promise<boolean> {
		await destroySession(data.sessionId);

		return true;
	}
}

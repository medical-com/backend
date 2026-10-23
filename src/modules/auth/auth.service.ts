import { randomUUID } from "node:crypto";

import db from "@/database";

import { AppError } from "@/core/errors/app-error";
import { hashPassword, verifyPassword } from "@/core/security/password";
import { createSession, destroySession } from "@/core/security/session.store";
import { AccountRole, AccountStatus } from "@/database/types";
import type { ClientAccount } from "@/types/client/account.type";
import { accountRepository, patientRepository, personRepository } from "@/database/repositories";
import redis from "@/core/redis";
import type { Knex } from "knex";
import { mailService } from "@/core/mail";

export default class AuthService {
	async register(data: {
		firstName: string;
		lastName: string;
		email: string;
		pesel: string;
		dateOfBirth: string;
		phoneNumber: string;
		password: string;
	}): Promise<boolean> {
		const account = await db.transaction(async (trx) => {
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

			await patientRepository.insert({ person_id: person.id }, trx);

			const passwordHash = await hashPassword(data.password);
			const account = await accountRepository.insert(
				{
					person_id: person.id,
					email: data.email,
					email_verified: false,
					password_hash: passwordHash,
					role: AccountRole.PATIENT,
					status: AccountStatus.ACTIVE,
				},
				trx,
			);

			const token = await this.createEmailVerificationToken({ accountId: account.id }, trx);
			if (!token) throw new Error("Failed to create email verification token");
			await mailService.sendEmailVerification({ email: account.email, token });

			return account;
		});

		return !!account;
	}

	async login(data: {
		email: string;
		password: string;
	}): Promise<{ clientAccount: ClientAccount; sessionId: string }> {
		const exist = await accountRepository.findByEmail({ email: data.email });
		if (!exist || !(await verifyPassword(data.password, exist.password_hash)))
			throw new AppError("Invalid email or password", 401);

		if (!exist.email_verified) throw new AppError("Please verify your email before logging in", 403);

		const account = await accountRepository.findWithPerson({ accountId: exist.id });
		if (!account) throw new AppError("Account not found", 404);

		await accountRepository.updateLastLoginAt({ id: account.id });

		const sessionId = await createSession(account.id);
		const clientAccount: ClientAccount = {
			id: account.id,
			firstName: account.person.first_name,
			lastName: account.person.last_name,
			pesel: account.person.pesel,
			email: account.email,
			emailVerified: account.email_verified,
			phone: account.person.phone,
			dateOfBirth: account.person.date_of_birth,
			role: account.role,
			createdAt: account.person.created_at,
		};

		return { clientAccount, sessionId };
	}

	async logout(data: { sessionId: string }): Promise<boolean> {
		await destroySession(data.sessionId);

		return true;
	}

	async me(data: { accountId: string }): Promise<ClientAccount | null> {
		const account = await accountRepository.findWithPerson({ accountId: data.accountId });
		if (!account) return null;

		return {
			id: account.id,
			firstName: account.person.first_name,
			lastName: account.person.last_name,
			pesel: account.person.pesel,
			email: account.email,
			emailVerified: account.email_verified,
			phone: account.person.phone,
			dateOfBirth: account.person.date_of_birth,
			role: account.role,
			createdAt: account.person.created_at,
		};
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

	async createPasswordResetToken(data: { accountId: string }): Promise<string> {
		const account = await accountRepository.findById({ id: data.accountId });
		if (!account) throw new AppError("Account not found", 404);

		const token = randomUUID();
		await redis.set(`password_reset_token:${token}`, account.id, "EX", 60 * 60); // 1 hour expiration

		return token;
	}

	async forgotPassword(data: { email: string }): Promise<boolean> {
		const account = await accountRepository.findByEmail({ email: data.email });
		if (!account) throw new AppError("Account not found", 404);

		const token = await this.createPasswordResetToken({ accountId: account.id });
		if (!token) throw new Error("Failed to create password reset token");
		await mailService.sendPasswordReset({ email: account.email, token });

		return true;
	}

	async resetPassword(data: { token: string; password: string }): Promise<boolean> {
		const accountId = await redis.get(`password_reset_token:${data.token}`);
		if (!accountId) throw new AppError("Invalid or expired reset token", 400);

		const account = await accountRepository.findById({ id: accountId });
		if (!account) throw new AppError("Account not found", 404);

		await redis.del(`password_reset_token:${data.token}`);

		const passwordHash = await hashPassword(data.password);
		const result = await accountRepository.updatePassword({ id: account.id, passwordHash });

		return !!result;
	}
}

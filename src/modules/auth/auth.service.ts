import { randomInt, randomUUID } from "node:crypto";

import db from "@/database";

import { AppError } from "@/core/errors/app-error";
import { hashPassword, verifyPassword } from "@/core/security/password";
import { createSession, getSession, destroyAllSessionsForUser, destroySession } from "@/core/security/session.store";

import {
	AccountRole,
	AccountStatus,
	AuditAction,
	AuditActorType,
	AuditEntityType,
	AuditOutcome,
} from "@/database/types";

import type { Account } from "@/database/types";
import type { ClientAccount } from "@/types/client/account.type";
import { accountRepository, patientRepository } from "@/database/repositories";

import redis from "@/core/redis";
import { mailService } from "@/core/mail";
import { createPerson } from "../../core/services/person.service";
import { auditService } from "@/core/audit/audit.service";

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
		const passwordHash = await hashPassword(data.password);

		const account = await db
			.transaction(async (trx) => {
				const person = await createPerson(
					{
						...data,
						phone: data.phoneNumber,
					},
					trx,
				);

				await patientRepository.insert({ person_id: person.id }, trx);

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

				await auditService.record(
					{
						action: AuditAction.ACCOUNT_CREATED,
						actorType: AuditActorType.ANONYMOUS,
						entityType: AuditEntityType.ACCOUNT,
						entityId: account.id,
						metadata: {
							source: "self_registration",
						},
					},
					trx,
				);

				return account;
			})
			.catch(async (error) => {
				await this.recordFailure(AuditAction.ACCOUNT_CREATED, "registration_failed");

				throw error;
			});

		const token = await this.createEmailVerificationToken({
			accountId: account.id,
		});

		await mailService.sendEmailVerification({
			email: account.email,
			token,
		});

		return true;
	}

	async login(data: {
		email: string;
		password: string;
	}): Promise<{ clientAccount: ClientAccount; sessionId: string }> {
		const exist = await accountRepository.findByEmail({
			email: data.email,
		});

		if (!exist || !(await verifyPassword(data.password, exist.password_hash))) {
			await this.recordFailure(AuditAction.LOGIN, "invalid_credentials", exist?.id);

			throw new AppError("Invalid email or password", 401);
		}

		if (exist.status !== AccountStatus.ACTIVE) {
			await this.recordFailure(AuditAction.LOGIN, "account_inactive", exist.id);

			throw new AppError("Account is not active", 403);
		}

		if (!exist.email_verified) {
			await this.recordFailure(AuditAction.LOGIN, "email_not_verified", exist.id);

			throw new AppError("Please verify your email before logging in", 403);
		}

		const account = await accountRepository.findWithPerson({
			accountId: exist.id,
		});

		if (!account) {
			await this.recordFailure(AuditAction.LOGIN, "account_not_found", exist.id);

			throw new AppError("Account not found", 404);
		}

		const sessionId = await createSession(account.id);

		try {
			await db.transaction(async (trx) => {
				await accountRepository.updateLastLoginAt({ id: account.id }, trx);

				await auditService.record(
					{
						action: AuditAction.LOGIN,
						actorType: AuditActorType.ACCOUNT,
						actorId: account.id,
						actorRole: account.role,
						entityType: AuditEntityType.ACCOUNT,
						entityId: account.id,
					},
					trx,
				);
			});
		} catch (error) {
			try {
				await destroySession(sessionId);
			} catch {
				console.error("Failed to destroy session after login rollback");
			}

			await this.recordFailure(AuditAction.LOGIN, "login_transaction_failed", account.id);

			throw error;
		}

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
		const session = await getSession(data.sessionId);

		await destroySession(data.sessionId);

		if (!session) {
			await this.recordFailure(AuditAction.LOGOUT, "session_not_found");

			return true;
		}

		const account = await accountRepository.findById({
			id: session.userId,
		});

		await auditService.record({
			action: AuditAction.LOGOUT,
			actorType: AuditActorType.ACCOUNT,
			actorId: session.userId,
			actorRole: account?.role,
			entityType: AuditEntityType.ACCOUNT,
			entityId: session.userId,
		});

		return true;
	}

	async me(data: { accountId: string }): Promise<ClientAccount | null> {
		const account = await accountRepository.findWithPerson({
			accountId: data.accountId,
		});

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

	async createEmailVerificationToken(data: { accountId: string }): Promise<string> {
		const account = await accountRepository.findById({
			id: data.accountId,
		});

		if (!account) throw new AppError("Account not found", 404);

		if (account.email_verified) throw new AppError("Email is already verified", 400);

		for (let attempt = 0; attempt < 10; attempt++) {
			const token = randomInt(100000, 1000000).toString();

			const result = await redis.set(`email_verification_token:${token}`, account.id, "EX", 60 * 60, "NX");

			if (result === "OK") return token;
		}

		throw new Error("Failed to create email verification token");
	}

	async confirmEmail(data: { token: string }): Promise<boolean> {
		const accountId = await redis.getdel(`email_verification_token:${data.token}`);

		if (!accountId) {
			await this.recordFailure(AuditAction.EMAIL_VERIFIED, "invalid_or_expired_token");

			throw new AppError("Invalid or expired verification token", 400);
		}

		const result = await db.transaction(async (trx) => {
			const account = await trx<Account>("public.accounts").where("id", accountId).forUpdate().first();

			if (!account) return "account_not_found";

			if (account.email_verified) return "email_already_verified";

			await accountRepository.updateEmailVerified(
				{
					id: account.id,
					emailVerified: true,
				},
				trx,
			);

			await auditService.record(
				{
					action: AuditAction.EMAIL_VERIFIED,
					actorType: AuditActorType.ANONYMOUS,
					entityType: AuditEntityType.ACCOUNT,
					entityId: account.id,
					changes: {
						email_verified: {
							old: false,
							new: true,
						},
					},
				},
				trx,
			);

			return "success";
		});

		if (result !== "success") {
			await this.recordFailure(AuditAction.EMAIL_VERIFIED, result, accountId);

			if (result === "account_not_found") throw new AppError("Account not found", 404);

			throw new AppError("Email is already verified", 400);
		}

		return true;
	}

	async createPasswordResetToken(data: { accountId: string }): Promise<string> {
		const account = await accountRepository.findById({
			id: data.accountId,
		});

		if (!account) throw new AppError("Account not found", 404);

		const token = randomUUID();

		await redis.set(`password_reset_token:${token}`, account.id, "EX", 60 * 60);

		return token;
	}

	async forgotPassword(data: { email: string }): Promise<boolean> {
		const account = await accountRepository.findByEmail({
			email: data.email,
		});

		if (!account) {
			await this.recordFailure(AuditAction.PASSWORD_RESET_REQUESTED, "account_not_found");

			throw new AppError("Account not found", 404);
		}

		const token = await this.createPasswordResetToken({
			accountId: account.id,
		});

		await mailService.sendPasswordReset({
			email: account.email,
			token,
		});

		await auditService.record({
			action: AuditAction.PASSWORD_RESET_REQUESTED,
			actorType: AuditActorType.ANONYMOUS,
			entityType: AuditEntityType.ACCOUNT,
			entityId: account.id,
		});

		return true;
	}

	async resetPassword(data: { token: string; password: string }): Promise<boolean> {
		const accountId = await redis.getdel(`password_reset_token:${data.token}`);

		if (!accountId) {
			await this.recordFailure(AuditAction.PASSWORD_RESET, "invalid_or_expired_token");

			throw new AppError("Invalid or expired reset token", 400);
		}

		const passwordHash = await hashPassword(data.password);

		const result = await db.transaction(async (trx) => {
			const account = await trx<Account>("public.accounts").where("id", accountId).forUpdate().first();

			if (!account) return false;

			await accountRepository.updatePassword(
				{
					id: account.id,
					passwordHash,
				},
				trx,
			);

			await auditService.record(
				{
					action: AuditAction.PASSWORD_RESET,
					actorType: AuditActorType.ANONYMOUS,
					entityType: AuditEntityType.ACCOUNT,
					entityId: account.id,
				},
				trx,
			);

			return true;
		});

		if (!result) {
			await this.recordFailure(AuditAction.PASSWORD_RESET, "account_not_found", accountId);

			throw new AppError("Account not found", 404);
		}

		await destroyAllSessionsForUser(accountId);

		return true;
	}

	private async recordFailure(action: AuditAction, reason: string, accountId?: string): Promise<void> {
		try {
			await auditService.record({
				action,
				actorType: AuditActorType.ANONYMOUS,
				outcome: AuditOutcome.FAILURE,
				entityType: AuditEntityType.ACCOUNT,
				entityId: accountId,
				metadata: {
					reason,
				},
			});
		} catch {
			console.error("Failed to record authentication audit log");
		}
	}
}

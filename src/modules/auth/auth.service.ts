import db from "@/database";
import type AccountRepository from "@/database/repositories/account.repository";
import type PersonRepository from "@/database/repositories/person.repository";

import { AppError } from "@/core/errors/app-error";
import { hashPassword, verifyPassword } from "@/core/security/password";
import { createSession, destroySession } from "@/core/security/session.store";
import { AccountRole, AccountStatus } from "@/database/types";
import type { ClientAccount } from "@/types/client/account.type";

export default class AuthService {
	constructor(
		readonly accountRepository: AccountRepository,
		readonly pearsonRepository: PersonRepository,
	) {}

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
			const personWithPeselExists = await this.pearsonRepository.findByPesel({ pesel: data.pesel }, trx);
			if (personWithPeselExists) throw new Error("Person with this pesel already exists");
			const personWithEmailExists = await this.pearsonRepository.findByEmail({ email: data.email }, trx);
			if (personWithEmailExists) throw new Error("Person with this email already exists");
			const personWithPhoneExists = await this.pearsonRepository.findByPhone({ phone: data.phoneNumber }, trx);
			if (personWithPhoneExists) throw new Error("Person with this phone number already exists");

			const person = await this.pearsonRepository.insert(
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

			const passwordHash = await hashPassword(data.password);
			const account = await this.accountRepository.insert(
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

			return account;
		});

		return !!account;
	}

	async login(data: { email: string; password: string }): Promise<{ account: ClientAccount; sessionId: string }> {
		const exist = await this.accountRepository.findByEmail({ email: data.email });
		if (!exist || !(await verifyPassword(data.password, exist.password_hash)))
			throw new AppError("Invalid email or password", 401);

		const account = await this.accountRepository.findWithPerson({ accountId: exist.id });
		if (!account) throw new AppError("Account not found", 404);

		await this.accountRepository.updateLastLoginAt({ id: account.id });

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
			createdAt: account.created_at,
		};

		return { account: clientAccount, sessionId };
	}

	async logout(data: { sessionId: string }): Promise<boolean> {
		await destroySession(data.sessionId);

		return true;
	}

	async me(data: { accountId: string }): Promise<ClientAccount> {
		const account = await this.accountRepository.findWithPerson({ accountId: data.accountId });
		if (!account) throw new AppError("Account not found", 404);

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
			createdAt: account.created_at,
		};
	}
}

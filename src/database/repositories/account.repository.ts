import db from "..";

import type { Knex } from "knex";
import type { Account, AccountRole, Person } from "../types";
import { DatabaseError } from "@/core/errors/database-error";

export class AccountRepository {
	async findById(data: { id: string }, trx?: Knex.Transaction): Promise<Account | undefined> {
		try {
			return await (trx || db)<Account>("public.accounts").select("*").where({ id: data.id }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findByEmail(data: { email: string }, trx?: Knex.Transaction): Promise<Account | undefined> {
		try {
			return await (trx || db)<Account>("public.accounts").select("*").where({ email: data.email }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findWithPerson(data: { accountId: string }, trx?: Knex.Transaction): Promise<Account & { person: Person }> {
		const account = await (trx || db)("accounts as a")
			.select(
				"a.id",
				"a.email",
				"a.role",
				"a.status",
				"a.email_verified",
				"a.last_login_at",
				"a.password_hash",

				"p.id as person_id",
				"p.first_name",
				"p.last_name",
				"p.phone",
				"p.pesel",
				"p.date_of_birth",
				"p.created_at as person_created_at",
				"p.updated_at as person_updated_at",
			)
			.join("persons as p", "p.id", "a.person_id")
			.where("a.id", data.accountId)
			.first();
		if (!account) throw new DatabaseError("Account not found");

		const {
			person_id,
			first_name,
			last_name,
			phone,
			pesel,
			date_of_birth,
			person_created_at,
			person_updated_at,
			...accountData
		} = account;

		return {
			...accountData,
			person: {
				id: person_id,
				first_name,
				last_name,
				phone,
				pesel,
				date_of_birth,
				created_at: person_created_at,
				updated_at: person_updated_at,
			},
		};
	}

	async insert(
		data: Omit<Account, "id" | "last_login_at" | "created_at" | "updated_at">,
		trx?: Knex.Transaction,
	): Promise<Account> {
		try {
			const [account] = await (trx || db)<Account>("public.accounts")
				.insert({ ...data })
				.returning("*");
			if (!account) throw new DatabaseError(new Error("Insert did not return a row"));

			return account;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async updateRole(data: { id: string; role: AccountRole }, trx?: Knex.Transaction): Promise<Account> {
		try {
			const [account] = await (trx || db)<Account>("public.accounts")
				.update({ role: data.role })
				.where({ id: data.id })
				.returning("*");
			if (!account) throw new DatabaseError(new Error("Update did not return a row"));

			return account;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async updateLastLoginAt(data: { id: string }, trx?: Knex.Transaction): Promise<Account> {
		try {
			const [account] = await (trx || db)<Account>("public.accounts")
				.update({ last_login_at: new Date() })
				.where({ id: data.id })
				.returning("*");
			if (!account) throw new DatabaseError(new Error("Update did not return a row"));

			return account;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async updateEmailVerified(data: { id: string; emailVerified: boolean }, trx?: Knex.Transaction): Promise<Account> {
		try {
			const [account] = await (trx || db)<Account>("public.accounts")
				.update({ email_verified: data.emailVerified })
				.where({ id: data.id })
				.returning("*");
			if (!account) throw new DatabaseError(new Error("Update did not return a row"));

			return account;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async updatePassword(data: { id: string; passwordHash: string }, trx?: Knex.Transaction): Promise<Account> {
		try {
			const [account] = await (trx || db)<Account>("public.accounts")
				.update({ password_hash: data.passwordHash })
				.where({ id: data.id })
				.returning("*");
			if (!account) throw new DatabaseError(new Error("Update did not return a row"));

			return account;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}
}

import db from "..";

import { Knex } from "knex";
import { Account, AccountGroup } from "../types";
import { DatabaseError } from "@/core/errors/database-error";

export default class AccountRepository {
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

	async updateGroup(data: { id: string; group: AccountGroup }, trx?: Knex.Transaction): Promise<Account> {
		try {
			const [account] = await (trx || db)<Account>("public.accounts")
				.update({ group: data.group })
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
}

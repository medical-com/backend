import type { Knex } from "knex";
import { DatabaseError } from "@/core/errors/database-error";
import db from "..";
import type { User } from "../types";

export default class UserRepository {
	async findById(data: { id: string }, trx?: Knex.Transaction): Promise<User | undefined> {
		try {
			return await (trx || db)<User>("public.users").select("*").where({ id: data.id }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findByEmail(data: { email: string }, trx?: Knex.Transaction): Promise<User | undefined> {
		try {
			return await (trx || db)<User>("public.users").select("*").where({ email: data.email }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findByUsername(data: { username: string }, trx?: Knex.Transaction): Promise<User | undefined> {
		try {
			return await (trx || db)<User>("public.users").select("*").where({ username: data.username }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async insert(
		data: Omit<User, "id" | "role" | "last_login_at" | "created_at" | "updated_at">,
		trx?: Knex.Transaction,
	): Promise<User> {
		try {
			const [user] = await (trx || db)<User>("public.users")
				.insert({ ...data })
				.returning("*");
			if (!user) throw new DatabaseError(new Error("Insert did not return a row"));

			return user;
		} catch (err) {
			if (err instanceof DatabaseError) throw err;
			throw new DatabaseError(err);
		}
	}

	async updateLastLoginAt(data: { id: string }, trx?: Knex.Transaction): Promise<User> {
		try {
			const [user] = await (trx || db)<User>("public.users")
				.update({ last_login_at: new Date() })
				.where({ id: data.id })
				.returning("*");
			if (!user) throw new DatabaseError(new Error("Update did not return a row"));

			return user;
		} catch (err) {
			if (err instanceof DatabaseError) throw err;
			throw new DatabaseError(err);
		}
	}
}

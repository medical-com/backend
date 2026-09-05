import db from "..";

import type { Knex } from "knex";
import type { Person } from "../types";
import { DatabaseError } from "@/core/errors/database-error";

export class PersonRepository {
	async findById(data: { id: string }, trx?: Knex.Transaction): Promise<Person | undefined> {
		try {
			return await (trx || db)<Person>("public.persons").select("*").where({ id: data.id }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findByPesel(data: { pesel: string }, trx?: Knex.Transaction): Promise<Person | undefined> {
		try {
			return await (trx || db)<Person>("public.persons").select("*").where({ pesel: data.pesel }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findByEmail(data: { email: string }, trx?: Knex.Transaction): Promise<Person | undefined> {
		try {
			return await (trx || db)<Person>("public.persons").select("*").where({ email: data.email }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findByPhone(data: { phone: string }, trx?: Knex.Transaction): Promise<Person | undefined> {
		try {
			return await (trx || db)<Person>("public.persons").select("*").where({ phone: data.phone }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async insert(data: Omit<Person, "id" | "created_at" | "updated_at">, trx?: Knex.Transaction): Promise<Person> {
		try {
			const [person] = await (trx || db)<Person>("public.persons")
				.insert({ ...data })
				.returning("*");
			if (!person) throw new DatabaseError(new Error("Insert did not return a row"));

			return person;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}
}

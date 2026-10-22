import db from "..";

import type { Knex } from "knex";
import type { Person } from "../types";
import { DatabaseError } from "@/core/errors/database-error";
import { AppError } from "@/core/errors/app-error";

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

	async update(
		data: { id: string; update: Partial<Omit<Person, "id" | "created_at" | "updated_at">> },
		trx?: Knex.Transaction,
	): Promise<Person> {
		try {
			const [person] = await (trx || db)<Person>("public.persons")
				.update({ ...data.update })
				.where({ id: data.id })
				.returning("*");
			if (!person) throw new DatabaseError(new Error("Update did not return a row"));

			return person;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async validateAndUpdate(
		data: { id: string; update: Partial<Omit<Person, "id" | "created_at" | "updated_at">> },
		trx?: Knex.Transaction,
	): Promise<Person> {
		const person = await this.findById({ id: data.id }, trx);
		if (!person) throw new AppError("Person not found");

		if (data.update.email && data.update.email !== person.email) {
			const existingEmail = await this.findByEmail({ email: data.update.email }, trx);
			if (existingEmail) throw new AppError("Email already exists");
		}

		if (data.update.pesel && data.update.pesel !== person.pesel) {
			const existingPesel = await this.findByPesel({ pesel: data.update.pesel }, trx);
			if (existingPesel) throw new AppError("PESEL already exists");
		}

		if (data.update.phone && data.update.phone !== person.phone) {
			const existingPhone = await this.findByPhone({ phone: data.update.phone }, trx);
			if (existingPhone) throw new AppError("Phone number already exists");
		}

		return await this.update(data, trx);
	}
}

import db from "..";

import { DatabaseError } from "@/core/errors/database-error";
import type { Knex } from "knex";
import type { Patient } from "../types";

export default class PatientRepository {
	async findById(data: { id: string }, trx?: Knex.Transaction): Promise<Patient | undefined> {
		try {
			return await (trx || db)<Patient>("public.patients").select("*").where({ id: data.id }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findByEmail(data: { email: string }, trx?: Knex.Transaction): Promise<Patient | undefined> {
		try {
			return await (trx || db)<Patient>("public.patients").select("*").where({ email: data.email }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async insert(data: Omit<Patient, "id" | "created_at" | "updated_at">, trx?: Knex.Transaction): Promise<Patient> {
		try {
			const [patient] = await (trx || db)<Patient>("public.patients")
				.insert({ ...data })
				.returning("*");
			if (!patient) throw new DatabaseError(new Error("Insert did not return a row"));

			return patient;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}
}

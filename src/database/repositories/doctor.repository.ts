import db from "..";

import { DatabaseError } from "@/core/errors/database-error";
import { Knex } from "knex";
import { Doctor, Person } from "../types";
import { WithPagination } from "@/types/pagination.type";

export class DoctorRepository {
	async listWithPerson(
		data: {
			filters?: {
				first_name?: string;
				last_name?: string;
			};
			page?: number;
			limit?: number;
		},
		trx?: Knex.Transaction,
	): Promise<WithPagination<Doctor & { person: Person }>> {
		const { filters, page = 1, limit = 10 } = data;

		if (!Number.isInteger(page) || page < 1) throw new DatabaseError("Page must be a positive integer");
		if (!Number.isInteger(limit) || limit < 1) throw new DatabaseError("Limit must be a positive integer");
		if (limit > 100) throw new DatabaseError("Limit cannot be greater than 100");

		try {
			const baseQuery = this.doctorWithPersonQuery(trx);

			if (filters?.first_name) baseQuery.where("public.persons.first_name", "ilike", `%${filters.first_name}%`);
			if (filters?.last_name) baseQuery.where("public.persons.last_name", "ilike", `%${filters.last_name}%`);

			const [doctors, countResult] = await Promise.all([
				baseQuery
					.clone()
					.orderBy("public.doctors.id", "asc")
					.offset((page - 1) * limit)
					.limit(limit),
				baseQuery.clone().clearSelect().clearOrder().countDistinct("public.doctors.id as total"),
			]);

			const total = Number(countResult[0]?.total ?? 0);
			const totalPages = Math.ceil(total / limit);

			return {
				data: doctors,
				total,
				page,
				limit,
				totalPages,
				hasNextPage: page < totalPages,
			};
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findById(data: { id: string }, trx?: Knex.Transaction): Promise<Doctor | undefined> {
		try {
			return await (trx || db)<Doctor>("public.doctors").select("*").where({ id: data.id }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findWithPerson(data: { doctorId: string }, trx?: Knex.Transaction): Promise<Doctor & { person: Person }> {
		try {
			const doctor = await this.doctorWithPersonQuery(trx).where("public.doctors.id", data.doctorId).first();
			if (!doctor) throw new DatabaseError("Doctor not found");
			return doctor;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async insert(data: Omit<Doctor, "id" | "created_at" | "updated_at">, trx?: Knex.Transaction): Promise<Doctor> {
		try {
			const [doctor] = await (trx || db)<Doctor>("public.doctors").insert(data).returning("*");
			if (!doctor) throw new DatabaseError(new Error("Insert did not return a row"));

			return doctor;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	private doctorWithPersonQuery(trx?: Knex.Transaction) {
		return (trx ?? db)<Doctor>("public.doctors")
			.select(
				"public.doctors.id",
				"public.doctors.person_id",
				"public.doctors.license_number",
				"public.doctors.specialization",
				"public.doctors.created_at",
				"public.doctors.updated_at",
			)
			.leftJoin("public.persons", "public.persons.id", "public.doctors.person_id");
	}
}

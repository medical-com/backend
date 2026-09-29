import db from "..";

import { DatabaseError } from "@/core/errors/database-error";
import { Knex } from "knex";
import { WithPagination } from "@/types/pagination.type";
import { Patient, Person } from "../types";

export class PatientRepository {
	async insert(data: { person_id?: string }, trx?: Knex.Transaction): Promise<Patient> {
		try {
			const [patient] = await (trx ?? db)("public.patients").insert(data).returning("*");
			return patient;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async list(
		data: {
			filters?: {
				name?: string;
				email?: string;
				phoneNumber?: string;
			};
			page?: number;
			limit?: number;
		},
		trx?: Knex.Transaction,
	): Promise<WithPagination<Patient & { person: Person }>> {
		const { filters, page = 1, limit = 10 } = data;

		if (!Number.isInteger(page) || page < 1) throw new DatabaseError("Page must be a positive integer");
		if (!Number.isInteger(limit) || limit < 1) throw new DatabaseError("Limit must be a positive integer");
		if (limit > 100) throw new DatabaseError("Limit cannot be greater than 100");

		try {
			const baseQuery = (trx || db)("public.patients as pa")
				.leftJoin("public.persons as pe", "pe.id", "pa.person_id")
				.select(
					"pa.id as patient_id",
					"pa.person_id as person_id",
					"pa.created_at as patient_created_at",
					"pa.updated_at as patient_updated_at",

					"pe.id as person_id",
					"pe.first_name as pe_first_name",
					"pe.last_name as pe_last_name",
					"pe.email as pe_email",
					"pe.phone as pe_phone",
					"pe.date_of_birth as pe_date_of_birth",
					"pe.pesel as pe_pesel",
					"pe.created_at as person_created_at",
					"pe.updated_at as person_updated_at",
				);

			const name = filters?.name?.trim();
			const email = filters?.email?.trim();
			const phoneNumber = filters?.phoneNumber?.trim();

			if (name)
				baseQuery.where((query) => {
					query.where("pe.first_name", "ilike", `%${name}%`).orWhere("pe.last_name", "ilike", `%${name}%`);
				});
			if (email) baseQuery.where("pe.email", "ilike", `%${email}%`);
			if (phoneNumber) baseQuery.where("pe.phone", "ilike", `%${phoneNumber}%`);

			const [patients, countResult] = await Promise.all([
				baseQuery
					.clone()
					.orderBy("pa.id", "asc")
					.offset((page - 1) * limit)
					.limit(limit),

				baseQuery.clone().clearSelect().clearOrder().countDistinct("pa.id as total"),
			]);

			const total = Number(countResult[0]?.total ?? 0);
			const totalPages = Math.ceil(total / limit);

			return {
				data: patients.map((patient) => ({
					id: patient.patient_id,
					person_id: patient.person_id,
					created_at: patient.patient_created_at,
					updated_at: patient.patient_updated_at,

					person: {
						id: patient.person_id,
						first_name: patient.pe_first_name,
						last_name: patient.pe_last_name,
						email: patient.pe_email,
						phone: patient.pe_phone,
						date_of_birth: patient.pe_date_of_birth,
						pesel: patient.pe_pesel,
						created_at: patient.person_created_at,
						updated_at: patient.person_updated_at,
					},
				})),

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
}

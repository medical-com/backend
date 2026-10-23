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

			if (filters?.first_name) baseQuery.where("persons.first_name", "ilike", `%${filters.first_name}%`);
			if (filters?.last_name) baseQuery.where("persons.last_name", "ilike", `%${filters.last_name}%`);

			const [doctors, countResult] = await Promise.all([
				baseQuery
					.clone()
					.orderBy("doctors.id", "asc")
					.offset((page - 1) * limit)
					.limit(limit),
				baseQuery.clone().clearSelect().clearOrder().countDistinct("doctors.id as total"),
			]);

			const total = Number(countResult[0]?.total ?? 0);
			const totalPages = Math.ceil(total / limit);

			return {
				data: doctors.map((doctor) => this.toDoctorWithPerson(doctor)),
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

	async findWithPerson(data: { doctorId: string }, trx?: Knex.Transaction): Promise<Doctor & { person: Person }> {
		try {
			const doctor = await this.doctorWithPersonQuery(trx).clone().where("doctors.id", data.doctorId).first();
			if (!doctor) throw new DatabaseError("Doctor not found");
			return this.toDoctorWithPerson(doctor);
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

	async update(
		data: {
			id: string;
			update: Partial<Pick<Doctor, "license_number" | "specialization">>;
		},
		trx?: Knex.Transaction,
	): Promise<Doctor> {
		try {
			const [doctor] = await (trx || db)<Doctor>("public.doctors")
				.update(data.update)
				.where({ id: data.id })
				.returning("*");
			if (!doctor) throw new DatabaseError(new Error("Update did not return a row"));

			return doctor;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	private doctorWithPersonQuery(trx?: Knex.Transaction) {
		return (trx ?? db)<Doctor>("public.doctors as doctors")
			.leftJoin("public.persons as persons", "persons.id", "doctors.person_id")
			.select(
				"doctors.id as doctor_id",
				"doctors.person_id as doctor_person_id",
				"doctors.license_number as doctor_license_number",
				"doctors.specialization as doctor_specialization",
				"doctors.created_at as doctor_created_at",
				"doctors.updated_at as doctor_updated_at",

				"persons.id as person_id",
				"persons.first_name as persons_first_name",
				"persons.last_name as persons_last_name",
				"persons.email as persons_email",
				"persons.phone as persons_phone",
				"persons.date_of_birth as persons_date_of_birth",
				"persons.pesel as persons_pesel",
				"persons.created_at as person_created_at",
				"persons.updated_at as person_updated_at",
			);
	}

	private toDoctorWithPerson(doctor: any): Doctor & { person: Person } {
		return {
			id: doctor.doctor_id,
			person_id: doctor.doctor_person_id,
			license_number: doctor.doctor_license_number,
			specialization: doctor.doctor_specialization,
			created_at: doctor.doctor_created_at,
			updated_at: doctor.doctor_updated_at,
			person: {
				id: doctor.person_id,
				first_name: doctor.persons_first_name,
				last_name: doctor.persons_last_name,
				email: doctor.persons_email,
				phone: doctor.persons_phone,
				date_of_birth: doctor.persons_date_of_birth,
				pesel: doctor.persons_pesel,
				created_at: doctor.person_created_at,
				updated_at: doctor.person_updated_at,
			},
		};
	}
}

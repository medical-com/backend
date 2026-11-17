import db from "..";

import { DatabaseError } from "@/core/errors/database-error";
import type { WithPagination } from "@/types/pagination.type";
import type { Knex } from "knex";
import type { DoctorScheduleException } from "../types";
import { getPaginationParams, withPagination } from "@/core/pagination";

export class DoctorScheduleExceptionRepository {
	async insert(
		data: Omit<DoctorScheduleException, "id" | "created_at" | "updated_at">,
		trx?: Knex.Transaction,
	): Promise<DoctorScheduleException> {
		try {
			const [exception] = await (trx ?? db)<DoctorScheduleException>("public.doctor_schedule_exceptions")
				.insert(data)
				.returning("*");
			if (!exception) throw new DatabaseError(new Error("Insert did not return a row"));
			return exception;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findById(data: { id: string }, trx?: Knex.Transaction): Promise<DoctorScheduleException | undefined> {
		try {
			return await (trx ?? db)<DoctorScheduleException>("public.doctor_schedule_exceptions")
				.where({ id: data.id })
				.first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async update(
		data: {
			id: string;
			update: Partial<Omit<DoctorScheduleException, "id" | "created_at" | "updated_at">>;
		},
		trx?: Knex.Transaction,
	): Promise<DoctorScheduleException> {
		try {
			const [exception] = await (trx ?? db)<DoctorScheduleException>("public.doctor_schedule_exceptions")
				.update({ ...data.update, updated_at: new Date() })
				.where({ id: data.id })
				.returning("*");
			if (!exception) throw new DatabaseError(new Error("Update did not return a row"));
			return exception;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async delete(data: { id: string }, trx?: Knex.Transaction): Promise<boolean> {
		try {
			const deleted = await (trx ?? db)<DoctorScheduleException>("public.doctor_schedule_exceptions")
				.where({ id: data.id })
				.delete();
			return deleted > 0;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async list(
		data: { doctorId: string; page?: number; limit?: number },
		trx?: Knex.Transaction,
	): Promise<WithPagination<DoctorScheduleException>> {
		const pagination = getPaginationParams(data, 100);

		try {
			const query = (trx ?? db)<DoctorScheduleException>("public.doctor_schedule_exceptions").where({
				doctor_id: data.doctorId,
			});
			const [exceptions, countResult] = await Promise.all([
				query
					.clone()
					.orderBy("start_at", "asc")
					.offset(pagination.offset)
					.limit(pagination.limit),
				query.clone().clearSelect().count("id as total"),
			]);
			const total = Number((countResult[0] as { total?: string | number } | undefined)?.total ?? 0);
			return withPagination(exceptions, total, pagination);
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findByDoctorAndDateRange(
		data: { doctorId: string; from: Date; to: Date },
		trx?: Knex.Transaction,
	): Promise<DoctorScheduleException[]> {
		try {
			return await (trx ?? db)<DoctorScheduleException>("public.doctor_schedule_exceptions")
				.where({ doctor_id: data.doctorId })
				.andWhere("start_at", "<=", data.to)
				.andWhere("end_at", ">=", data.from)
				.orderBy("start_at", "asc");
		} catch (err) {
			throw new DatabaseError(err);
		}
	}
}

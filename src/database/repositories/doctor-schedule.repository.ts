import db from "..";

import { DatabaseError } from "@/core/errors/database-error";
import type { WithPagination } from "@/types/pagination.type";
import type { DoctorSchedule } from "../types";
import type { Knex } from "knex";
import { getPaginationParams, withPagination } from "@/core/pagination";

export class DoctorScheduleRepository {
	async insert(
		data: Omit<DoctorSchedule, "id" | "created_at" | "updated_at">,
		trx?: Knex.Transaction,
	): Promise<DoctorSchedule> {
		try {
			const [schedule] = await (trx ?? db)<DoctorSchedule>("public.doctor_schedules").insert(data).returning("*");
			if (!schedule) throw new DatabaseError(new Error("Insert did not return a row"));
			return schedule;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async update(
		data: {
			id: string;
			update: Partial<Omit<DoctorSchedule, "id" | "created_at" | "updated_at">>;
		},
		trx?: Knex.Transaction,
	): Promise<DoctorSchedule> {
		try {
			const [schedule] = await (trx ?? db)<DoctorSchedule>("public.doctor_schedules")
				.update({ ...data.update, updated_at: new Date() })
				.where({ id: data.id })
				.returning("*");
			if (!schedule) throw new DatabaseError(new Error("Update did not return a row"));
			return schedule;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findById(data: { id: string }, trx?: Knex.Transaction): Promise<DoctorSchedule | undefined> {
		try {
			return await (trx ?? db)<DoctorSchedule>("public.doctor_schedules").where({ id: data.id }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findByDoctorAndDay(
		data: { doctorId: string; dayOfWeek: number; excludeId?: string },
		trx?: Knex.Transaction,
	): Promise<DoctorSchedule | undefined> {
		try {
			const query = (trx ?? db)<DoctorSchedule>("public.doctor_schedules").where({
				doctor_id: data.doctorId,
				day_of_week: data.dayOfWeek,
			});
			if (data.excludeId) query.whereNot({ id: data.excludeId });
			return await query.first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findByDoctorAndDateRange(
		data: { doctorId: string; from: Date; to: Date },
		trx?: Knex.Transaction,
	): Promise<DoctorSchedule[]> {
		try {
			return await (trx ?? db)<DoctorSchedule>("public.doctor_schedules")
				.where({ doctor_id: data.doctorId })
				.andWhere("valid_from", "<=", data.to)
				.andWhere((builder) => {
					builder.whereNull("valid_to").orWhere("valid_to", ">=", data.from);
				});
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async list(
		data: {
			filters?: { doctorId?: string; doctorName?: string };
			page?: number;
			limit?: number;
		},
		trx?: Knex.Transaction,
	): Promise<WithPagination<DoctorSchedule>> {
		const { filters } = data;
		const pagination = getPaginationParams(data);

		try {
			const query = (trx ?? db)<DoctorSchedule>("public.doctor_schedules as schedules")
				.leftJoin("public.doctors as doctors", "doctors.id", "schedules.doctor_id")
				.leftJoin("public.persons as persons", "persons.id", "doctors.person_id")
				.select("schedules.*");

			if (filters?.doctorId) query.where("schedules.doctor_id", filters.doctorId);
			if (filters?.doctorName) {
				query.whereRaw("concat_ws(' ', persons.first_name, persons.last_name) ilike ?", [
					`%${filters.doctorName}%`,
				]);
			}

			const [schedules, countResult] = await Promise.all([
				query
					.clone()
					.orderBy(["schedules.doctor_id", { column: "schedules.day_of_week", order: "asc" }])
					.orderBy("schedules.start_time", "asc")
					.offset(pagination.offset)
					.limit(pagination.limit),
				query.clone().clearSelect().clearOrder().countDistinct("schedules.id as total"),
			]);

			const total = Number(countResult[0]?.total ?? 0);
			return withPagination(schedules, total, pagination);
		} catch (err) {
			throw new DatabaseError(err);
		}
	}
}

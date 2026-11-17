import db from "..";

import { DatabaseError } from "@/core/errors/database-error";
import type { WithPagination } from "@/types/pagination.type";
import type { Knex } from "knex";
import type { Service, ServiceCategory } from "../types";
import { getPaginationParams, withPagination } from "@/core/pagination";

export class ServiceRepository {
	async findById(data: { id: string }, trx?: Knex.Transaction): Promise<Service | undefined> {
		try {
			return await (trx || db)<Service>("public.services").where({ id: data.id }).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async list(
		data: {
			filters?: { name?: string; category?: ServiceCategory };
			page?: number;
			limit?: number;
		},
		trx?: Knex.Transaction,
	): Promise<WithPagination<Service>> {
		const { filters } = data;
		const pagination = getPaginationParams(data);

		try {
			const query = (trx || db)<Service>("public.services");
			if (filters?.name) query.where("name", "ilike", `%${filters.name}%`);
			if (filters?.category) query.where("category", filters.category);

			const [services, countResult] = await Promise.all([
				query
					.clone()
					.orderBy("name", "asc")
					.offset(pagination.offset)
					.limit(pagination.limit),
				query.clone().clearSelect().clearOrder().count<{ total: string }>("id as total").first(),
			]);
			const total = Number(countResult?.total ?? 0);
			return withPagination(services, total, pagination);
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async insert(data: Omit<Service, "id" | "created_at" | "updated_at">, trx?: Knex.Transaction): Promise<Service> {
		try {
			const [service] = await (trx ?? db)<Service>("public.services").insert(data).returning("*");
			if (!service) throw new DatabaseError("Insert did not return a row");
			return service;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async update(
		data: {
			id: string;
			update: Partial<Pick<Service, "name" | "description" | "category" | "duration" | "doctor_ids">>;
		},
		trx?: Knex.Transaction,
	): Promise<Service> {
		try {
			const [service] = await (trx ?? db)<Service>("public.services")
				.where({ id: data.id })
				.update({ ...data.update, updated_at: new Date() })
				.returning("*");
			if (!service) throw new DatabaseError("Update did not return a row");
			return service;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async delete(data: { id: string }, trx?: Knex.Transaction): Promise<boolean> {
		try {
			return (await (trx || db)<Service>("public.services").where({ id: data.id }).delete()) > 0;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}
}

import db from "..";

import { DatabaseError } from "@/core/errors/database-error";
import type { WithPagination } from "@/types/pagination.type";
import type { Knex } from "knex";
import type { Service, ServiceCategory } from "../types";

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
		const { filters, page = 1, limit = 10 } = data;
		if (!Number.isInteger(page) || page < 1) throw new DatabaseError("Page must be a positive integer");
		if (!Number.isInteger(limit) || limit < 1) throw new DatabaseError("Limit must be a positive integer");
		if (limit > 100) throw new DatabaseError("Limit cannot be greater than 100");

		try {
			const query = (trx || db)<Service>("public.services");
			if (filters?.name) query.where("name", "ilike", `%${filters.name}%`);
			if (filters?.category) query.where("category", filters.category);

			const [services, countResult] = await Promise.all([
				query
					.clone()
					.orderBy("name", "asc")
					.offset((page - 1) * limit)
					.limit(limit),
				query.clone().clearSelect().clearOrder().count<{ total: string }>("id as total").first(),
			]);
			const total = Number(countResult?.total ?? 0);
			const totalPages = Math.ceil(total / limit);

			return { data: services, total, page, limit, totalPages, hasNextPage: page < totalPages };
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

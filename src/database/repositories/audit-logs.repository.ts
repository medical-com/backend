import db from "..";

import type { Knex } from "knex";
import { DatabaseError } from "@/core/errors/database-error";
import { getPaginationParams, withPagination } from "@/core/pagination";
import type { WithPagination } from "@/types/pagination.type";
import type { AuditLog, AuditAction, AuditActorType, AuditEntityType, AuditOutcome } from "../types";

export class AuditLogRepository {
	async insert(
		data: Pick<AuditLog, "action" | "actor_type" | "outcome"> &
			Partial<Omit<AuditLog, "id" | "created_at" | "action" | "actor_type" | "outcome">>,
		trx?: Knex.Transaction,
	): Promise<AuditLog> {
		try {
			const [log] = await (trx ?? db)<AuditLog>("public.audit_logs").insert(data).returning("*");

			if (!log) throw new DatabaseError("Failed to insert audit log");

			return log;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async findById(data: { id: string }, trx?: Knex.Transaction): Promise<AuditLog | undefined> {
		try {
			return await (trx ?? db)<AuditLog>("public.audit_logs").where("id", data.id).first();
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async list(
		data: {
			filters?: {
				actorId?: string;
				actorType?: AuditActorType;
				action?: AuditAction;
				outcome?: AuditOutcome;
				entityType?: AuditEntityType;
				entityId?: string;
				requestId?: string;
				from?: Date;
				to?: Date;
			};
			page?: number;
			limit?: number;
		},
		trx?: Knex.Transaction,
	): Promise<WithPagination<AuditLog>> {
		const { filters } = data;
		const pagination = getPaginationParams(data, 100);

		try {
			const query = (trx ?? db)<AuditLog>("public.audit_logs");

			if (filters?.actorId) query.where("actor_id", filters.actorId);

			if (filters?.actorType) query.where("actor_type", filters.actorType);

			if (filters?.action) query.where("action", filters.action);

			if (filters?.outcome) query.where("outcome", filters.outcome);

			if (filters?.entityType) query.where("entity_type", filters.entityType);

			if (filters?.entityId) query.where("entity_id", filters.entityId);

			if (filters?.requestId) query.where("request_id", filters.requestId);

			if (filters?.from) query.where("created_at", ">=", filters.from);

			if (filters?.to) query.where("created_at", "<=", filters.to);

			const [logs, countResult] = await Promise.all([
				query
					.clone()
					.orderBy("created_at", "desc")
					.orderBy("id", "desc")
					.offset(pagination.offset)
					.limit(pagination.limit),

				query.clone().count("* as total"),
			]);

			const total = Number((countResult as unknown as { total?: string | number }[])[0]?.total ?? 0);

			return withPagination(logs, total, pagination);
		} catch (err) {
			throw new DatabaseError(err);
		}
	}
}

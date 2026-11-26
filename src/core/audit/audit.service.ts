import type { Knex } from "knex";

import { auditLogRepository } from "@/database/repositories";
import { getRequestContext } from "@/core/context/request-context";

import { AuditAction, AuditActorType, AuditEntityType, AuditOutcome } from "@/database/types";

import type { AccountRole, AuditChanges, AuditLog } from "@/database/types";

interface AuditData {
	action: AuditAction;
	outcome?: AuditOutcome;

	actorId?: string;
	actorType: AuditActorType;
	actorRole?: AccountRole;

	entityType?: AuditEntityType;
	entityId?: string;

	changes?: AuditChanges;
	metadata?: Record<string, unknown>;

	ipAddress?: string;
	userAgent?: string;
	requestId?: string;
}

class AuditService {
	async record(data: AuditData, trx?: Knex.Transaction): Promise<AuditLog> {
		const context = getRequestContext();

		if (data.actorType === AuditActorType.ACCOUNT && !data.actorId)
			throw new Error("Account actor requires an actor ID");

		if (data.entityId && !data.entityType) throw new Error("Entity ID requires an entity type");

		return auditLogRepository.insert(
			{
				action: data.action,
				outcome: data.outcome ?? AuditOutcome.SUCCESS,

				actor_id: data.actorId ?? null,
				actor_type: data.actorType,
				actor_role: data.actorRole ?? null,

				entity_type: data.entityType ?? null,
				entity_id: data.entityId ?? null,

				changes: data.changes ?? null,
				metadata: data.metadata ?? null,

				ip_address: data.ipAddress ?? context?.ipAddress ?? null,
				user_agent: data.userAgent ?? context?.userAgent ?? null,
				request_id: data.requestId ?? context?.requestId ?? null,
			},
			trx,
		);
	}
}

export const auditService = new AuditService();

import type express from "express";
import { AccountRole } from "@/database/types/accounts.types";
import { RequireAuth } from "@/core/decorators/require-auth";
import { Throttle } from "@/core/decorators/throttle";
import { validate } from "@/core/security/validate";
import { dashboardServiceService as service } from "./service.service";
import {
	DashboardServiceResponse,
	DashboardServiceSchema,
	DashboardServiceDeleteResponse,
	DashboardServiceDeleteSchema,
	DashboardServiceFindOneQuerySchema,
	DashboardServiceFindOneResponse,
	DashboardServiceListQuerySchema,
	DashboardServiceListResponse,
	DashboardServiceUpdateResponse,
	DashboardServiceUpdateSchema,
} from "./types/service.schema";

export default class DashboardServiceController {
	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async findOne(req: express.Request, res: express.Response<DashboardServiceFindOneResponse>) {
		const { id } = validate(DashboardServiceFindOneQuerySchema, req.query);
		const data = await service.findOne(id);
		res.json(data);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async list(req: express.Request, res: express.Response<DashboardServiceListResponse>) {
		const { name, category, page, limit } = validate(DashboardServiceListQuerySchema, req.query);
		const result = await service.list({ filters: { name, category }, page, limit });
		res.json({
			data: result.data,
			pagination: {
				total: result.total,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
				hasNextPage: result.hasNextPage,
			},
		});
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async create(req: express.Request, res: express.Response<DashboardServiceResponse>) {
		const data = validate(DashboardServiceSchema, req.body);
		const created = await service.create(data);
		res.status(201).json(created);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async update(req: express.Request, res: express.Response<DashboardServiceUpdateResponse>) {
		const { id, ...update } = validate(DashboardServiceUpdateSchema, req.body);
		const data = await service.update({ id, update });
		res.json(data);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async delete(req: express.Request, res: express.Response<DashboardServiceDeleteResponse>) {
		const { id } = validate(DashboardServiceDeleteSchema, req.body);
		const success = await service.delete(id);
		res.json({ success });
	}
}

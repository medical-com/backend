import type express from "express";
import { AccountRole } from "@/database/types/accounts.types";
import { RequireAuth } from "@/core/decorators/require-auth";
import { Throttle } from "@/core/decorators/throttle";
import { validate } from "@/core/security/validate";
import { dashboardServiceService as service } from "./service.service";
import {
	CreateServiceResponse,
	CreateServiceSchema,
	DeleteServiceResponse,
	DeleteServiceSchema,
	FindOneServiceQuerySchema,
	FindOneServiceResponse,
	ListServiceQuerySchema,
	ListServiceResponse,
	UpdateServiceResponse,
	UpdateServiceSchema,
} from "./types/service.schema";

export default class DashboardServiceController {
	@RequireAuth({ role: AccountRole.ADMIN })
	@Throttle({ limit: 10, windowMs: 1000 })
	async findOne(req: express.Request, res: express.Response<FindOneServiceResponse>) {
		const { id } = validate(FindOneServiceQuerySchema, req.query);
		const data = await service.findOne(id);
		res.json(data);
	}

	@RequireAuth({ role: AccountRole.ADMIN })
	@Throttle({ limit: 10, windowMs: 1000 })
	async list(req: express.Request, res: express.Response<ListServiceResponse>) {
		const { name, category, page, limit } = validate(ListServiceQuerySchema, req.query);
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

	@RequireAuth({ role: AccountRole.ADMIN })
	@Throttle({ limit: 10, windowMs: 1000 })
	async create(req: express.Request, res: express.Response<CreateServiceResponse>) {
		const data = validate(CreateServiceSchema, req.body);
		const created = await service.create(data);
		res.status(201).json(created);
	}

	@RequireAuth({ role: AccountRole.ADMIN })
	@Throttle({ limit: 10, windowMs: 1000 })
	async update(req: express.Request, res: express.Response<UpdateServiceResponse>) {
		const { id, ...update } = validate(UpdateServiceSchema, req.body);
		const data = await service.update({ id, update });
		res.json(data);
	}

	@RequireAuth({ role: AccountRole.ADMIN })
	@Throttle({ limit: 10, windowMs: 1000 })
	async delete(req: express.Request, res: express.Response<DeleteServiceResponse>) {
		const { id } = validate(DeleteServiceSchema, req.body);
		const success = await service.delete(id);
		res.json({ success });
	}
}

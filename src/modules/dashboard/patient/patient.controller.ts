import type express from "express";

import { validate } from "@/core/security/validate";
import { DashboardPatientListQuerySchema, DashboardPatientListResponse } from "./types/patient.schema";
import { dashboardPatientService as service } from "./patient.service";
import { RequireAuth } from "@/core/decorators/require-auth";
import { Throttle } from "@/core/decorators/throttle";

class DashboardPatientController {
	@RequireAuth()
	@Throttle({ limit: 10, windowMs: 1000 })
	async list(req: express.Request, res: express.Response<DashboardPatientListResponse>) {
		const { email, name, phoneNumber, page, limit } = validate(DashboardPatientListQuerySchema, req.query);

		const result = await service.list({ filters: { email, name, phoneNumber }, page, limit });
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
}
export const dashboardPatientController = new DashboardPatientController();

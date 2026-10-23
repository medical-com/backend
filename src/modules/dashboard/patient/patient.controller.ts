import type express from "express";

import { validate } from "@/core/security/validate";
import {
	DashboardPatientListQuerySchema,
	DashboardPatientListResponse,
	DashboardPatientUpdateSchema,
	FindOneQuerySchema,
	FindOneResponse,
} from "./types/patient.schema";
import { dashboardPatientService as service } from "./patient.service";
import { RequireAuth } from "@/core/decorators/require-auth";
import { Throttle } from "@/core/decorators/throttle";
import { AccountRole } from "@/database/types/accounts.types";

class DashboardPatientController {
	@RequireAuth({ role: AccountRole.ADMIN })
	@Throttle({ limit: 10, windowMs: 1000 })
	async findOne(req: express.Request, res: express.Response<FindOneResponse>) {
		const { id } = validate(FindOneQuerySchema, req.query);

		const patient = await service.findOne(id);
		res.json(patient);
	}

	@RequireAuth({ role: AccountRole.ADMIN })
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

	@RequireAuth({ role: AccountRole.ADMIN })
	@Throttle({ limit: 10, windowMs: 1000 })
	async update(req: express.Request, res: express.Response) {
		const { id, firstName, lastName, email, phoneNumber, dateOfBirth, pesel } = validate(
			DashboardPatientUpdateSchema,
			req.body,
		);

		const updatedPatient = await service.update({
			id,
			update: { firstName, lastName, email, phoneNumber, dateOfBirth, pesel },
		});
		res.json(updatedPatient);
	}
}
export const dashboardPatientController = new DashboardPatientController();

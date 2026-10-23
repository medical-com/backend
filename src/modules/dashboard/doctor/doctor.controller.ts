import type express from "express";

import { FindOneQuerySchema, ListQuerySchema } from "./types/doctor.schema";
import type { FindOneResponse, ListDoctorsResponse } from "./types/doctor.schema";
import { validate } from "@/core/security/validate";

import { dashboardDoctorService as service } from "./doctor.service";

export default class DashboardDoctorController {
	async findOne(req: express.Request, res: express.Response<FindOneResponse>) {
		const { id } = validate(FindOneQuerySchema, req.query);

		const doctor = await service.findOne(id);

		if (!doctor) return;

		res.json(doctor);
	}

	async list(req: express.Request, res: express.Response<ListDoctorsResponse>) {
		const { firstName, lastName, page, limit } = validate(ListQuerySchema, req.query);
		const result = await service.list({
			filters: { firstName, lastName },
			page,
			limit,
		});

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

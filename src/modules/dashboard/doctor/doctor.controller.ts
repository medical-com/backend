import type express from "express";

import { FindOneQuerySchema, ListQuerySchema, UpdateDoctorSchema } from "./types/doctor.schema";
import type { FindOneResponse, ListDoctorsResponse } from "./types/doctor.schema";
import { validate } from "@/core/security/validate";

import { dashboardDoctorService as service } from "./doctor.service";
import { RequireAuth } from "@/core/decorators/require-auth";
import { Throttle } from "@/core/decorators/throttle";
import { AccountRole } from "@/database/types/accounts.types";

export default class DashboardDoctorController {
	@RequireAuth({ role: AccountRole.ADMIN })
	@Throttle({ limit: 10, windowMs: 1000 })
	async findOne(req: express.Request, res: express.Response<FindOneResponse>) {
		const { id } = validate(FindOneQuerySchema, req.query);

		const doctor = await service.findOne(id);

		if (!doctor) return;

		res.json(doctor);
	}

	@RequireAuth({ role: AccountRole.ADMIN })
	@Throttle({ limit: 10, windowMs: 1000 })
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

	@RequireAuth({ role: AccountRole.ADMIN })
	@Throttle({ limit: 10, windowMs: 1000 })
	async update(req: express.Request, res: express.Response) {
		const { id, firstName, lastName, email, phoneNumber, dateOfBirth, pesel, licenseNumber, specialization } =
			validate(UpdateDoctorSchema, req.body);

		const updatedDoctor = await service.update({
			id,
			update: { firstName, lastName, email, phoneNumber, dateOfBirth, pesel, licenseNumber, specialization },
		});
		res.json(updatedDoctor);
	}
}

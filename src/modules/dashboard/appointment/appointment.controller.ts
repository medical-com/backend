import type express from "express";

import { RequireAuth } from "@/core/decorators/require-auth";
import { Throttle } from "@/core/decorators/throttle";
import { validate } from "@/core/security/validate";
import { AccountRole } from "@/database/types/accounts.types";
import {
	ListAvailableDatesSchema,
	type ListAvailableDatesResponse,
} from "./types/appointment.schema";
import { dashboardAppointmentService as service } from "./appointment.service";

class DashboardAppointmentController {
	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async listAvailableDates(
		req: express.Request,
		res: express.Response<ListAvailableDatesResponse>,
	) {
		const data = validate(ListAvailableDatesSchema, req.query);
		const dates = await service.listAvailableDates(data);
		res.json({ data: dates });
	}
}

export const dashboardAppointmentController = new DashboardAppointmentController();

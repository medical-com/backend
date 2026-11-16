import type express from "express";

import { RequireAuth } from "@/core/decorators/require-auth";
import { Throttle } from "@/core/decorators/throttle";
import { validate } from "@/core/security/validate";
import { AccountRole } from "@/database/types/accounts.types";
import {
	DashboardAppointmentSchema,
	DashboardAppointmentFindOneQuerySchema,
	DashboardAppointmentListQuerySchema,
	type DashboardAppointmentFindOneResponse,
	type DashboardAppointmentListResponse,
	DashboardAppointmentListAvailableDatesQuerySchema,
	type DashboardAppointmentListAvailableDatesResponse,
	DashboardAppointmentUpdateStatusSchema,
	DashboardAppointmentUpdateStatusResponse,
} from "./types/appointment.schema";
import { dashboardAppointmentService as service } from "./appointment.service";

class DashboardAppointmentController {
	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async listAvailableDates(
		req: express.Request,
		res: express.Response<DashboardAppointmentListAvailableDatesResponse>,
	) {
		const data = validate(DashboardAppointmentListAvailableDatesQuerySchema, req.query);
		const dates = await service.listAvailableDates(data);
		res.json({ data: dates });
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async create(req: express.Request, res: express.Response) {
		const date = validate(DashboardAppointmentSchema, req.body);
		const appointment = await service.create(date);
		res.status(201).json({ data: appointment });
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async list(req: express.Request, res: express.Response<DashboardAppointmentListResponse>) {
		const data = validate(DashboardAppointmentListQuerySchema, req.query);
		const result = await service.list({
			filters: {
				doctorId: data.doctorId,
				serviceId: data.serviceId,
				patientName: data.patientName,
				patientEmail: data.patientEmail,
				patientPhone: data.patientPhone,
				patientPesel: data.patientPesel,
				status: data.status,
				from: data.from,
				to: data.to,
			},
			page: data.page,
			limit: data.limit,
		});
		const { data: appointments, ...pagination } = result;
		res.json({ data: appointments, pagination });
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async findOne(req: express.Request, res: express.Response<DashboardAppointmentFindOneResponse>) {
		const { id } = validate(DashboardAppointmentFindOneQuerySchema, req.query);
		res.json(await service.findOne(id));
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async updateStatus(req: express.Request, res: express.Response<DashboardAppointmentUpdateStatusResponse>) {
		const { id, status } = validate(DashboardAppointmentUpdateStatusSchema, req.body);
		const appointment = await service.updateStatus({ id, status });

		return res.json({ status: appointment.status });
	}
}

export const dashboardAppointmentController = new DashboardAppointmentController();

import type express from "express";

import { RequireAuth } from "@/core/decorators/require-auth";
import { Throttle } from "@/core/decorators/throttle";
import { validate } from "@/core/security/validate";
import { AccountRole } from "@/database/types/accounts.types";
import {
	CreateAppointmentSchema,
	FindOneAppointmentQuerySchema,
	ListAppointmentsQuerySchema,
	type FindOneAppointmentResponse,
	type ListAppointmentsResponse,
	ListAvailableDatesQuerySchema,
	type ListAvailableDatesResponse,
} from "./types/appointment.schema";
import { dashboardAppointmentService as service } from "./appointment.service";

class DashboardAppointmentController {
	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async listAvailableDates(req: express.Request, res: express.Response<ListAvailableDatesResponse>) {
		const data = validate(ListAvailableDatesQuerySchema, req.query);
		const dates = await service.listAvailableDates(data);
		res.json({ data: dates });
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async create(req: express.Request, res: express.Response) {
		const date = validate(CreateAppointmentSchema, req.body);
		const appointment = await service.create(date);
		res.status(201).json({ data: appointment });
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async list(req: express.Request, res: express.Response<ListAppointmentsResponse>) {
		const data = validate(ListAppointmentsQuerySchema, req.query);
		const result = await service.list({
			filters: {
				doctorId: data.doctorId,
				serviceId: data.serviceId,
				patientName: data.patientName,
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
	async findOne(req: express.Request, res: express.Response<FindOneAppointmentResponse>) {
		const { id } = validate(FindOneAppointmentQuerySchema, req.query);
		res.json(await service.findOne(id));
	}
}

export const dashboardAppointmentController = new DashboardAppointmentController();

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
	DashboardAppointmentMedicalRecordCreateSchema,
	DashboardAppointmentMedicalRecordUpdateSchema,
	DashboardAppointmentMedicalRecordFindOneQuerySchema,
	type DashboardAppointmentMedicalRecordResponse,
	DashboardAppointmentMedicalRecordListQuerySchema,
	type DashboardAppointmentMedicalRecordListResponse,
} from "./types/appointment.schema";
import { dashboardAppointmentService as service } from "./appointment.service";

class DashboardAppointmentController {
	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST, AccountRole.DOCTOR] })
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

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST, AccountRole.DOCTOR] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async list(req: express.Request, res: express.Response<DashboardAppointmentListResponse>) {
		const data = validate(DashboardAppointmentListQuerySchema, req.query);
		const result = await service.list({
			account: req.account!,
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

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST, AccountRole.DOCTOR] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async findOne(req: express.Request, res: express.Response<DashboardAppointmentFindOneResponse>) {
		const { id } = validate(DashboardAppointmentFindOneQuerySchema, req.query);
		res.json(await service.findOne({ id, account: req.account! }));
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST, AccountRole.DOCTOR] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async updateStatus(req: express.Request, res: express.Response<DashboardAppointmentUpdateStatusResponse>) {
		const { id, status } = validate(DashboardAppointmentUpdateStatusSchema, req.body);
		const appointment = await service.updateStatus({ id, status, account: req.account! });

		return res.json({ status: appointment.status });
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.DOCTOR] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async createMedicalRecord(req: express.Request, res: express.Response<DashboardAppointmentMedicalRecordResponse>) {
		const data = validate(DashboardAppointmentMedicalRecordCreateSchema, req.body);
		res.status(201).json(await service.createMedicalRecord({ ...data, account: req.account! }));
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.DOCTOR] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async updateMedicalRecord(req: express.Request, res: express.Response<DashboardAppointmentMedicalRecordResponse>) {
		const data = validate(DashboardAppointmentMedicalRecordUpdateSchema, req.body);
		res.json(await service.updateMedicalRecord({ ...data, account: req.account! }));
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.DOCTOR] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async findOneMedicalRecord(req: express.Request, res: express.Response<DashboardAppointmentMedicalRecordResponse>) {
		const data = validate(DashboardAppointmentMedicalRecordFindOneQuerySchema, req.query);
		res.json(await service.findOneMedicalRecord({ ...data, account: req.account! }));
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.DOCTOR] })
	@Throttle({ limit: 30, windowMs: 1000 })
	async listMedicalRecords(
		req: express.Request,
		res: express.Response<DashboardAppointmentMedicalRecordListResponse>,
	) {
		const data = validate(DashboardAppointmentMedicalRecordListQuerySchema, req.query);
		const result = await service.listMedicalRecords({ ...data, account: req.account! });
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

export const dashboardAppointmentController = new DashboardAppointmentController();

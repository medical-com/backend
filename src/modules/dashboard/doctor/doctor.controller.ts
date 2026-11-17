import type express from "express";

import {
	DashboardDoctorConfirmInvitationSchema,
	DashboardDoctorSchema,
	DashboardDoctorScheduleExceptionSchema,
	DashboardDoctorScheduleExceptionDeleteSchema,
	DashboardDoctorScheduleExceptionListQuerySchema,
	DashboardDoctorFindOneQuerySchema,
	DashboardDoctorScheduleSchema,
	DashboardDoctorScheduleListQuerySchema,
	DashboardDoctorListQuerySchema,
	DashboardDoctorScheduleExceptionUpdateSchema,
	DashboardDoctorScheduleUpdateSchema,
	DashboardDoctorUpdateSchema,
} from "./types/doctor.schema";
import type {
	DashboardDoctorScheduleListResponse,
	DashboardDoctorScheduleExceptionResponse,
	DashboardDoctorScheduleExceptionListResponse,
	DashboardDoctorScheduleResponse,
	DashboardDoctorFindOneResponse,
	DashboardDoctorListResponse,
} from "./types/doctor.schema";
import { validate } from "@/core/security/validate";

import { dashboardDoctorService as service } from "./doctor.service";
import { RequireAuth } from "@/core/decorators/require-auth";
import { Throttle } from "@/core/decorators/throttle";
import { AccountRole } from "@/database/types/accounts.types";

export default class DashboardDoctorController {
	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async findOne(req: express.Request, res: express.Response<DashboardDoctorFindOneResponse>) {
		const { id } = validate(DashboardDoctorFindOneQuerySchema, req.query);

		const doctor = await service.findOne(id);

		if (!doctor) return;

		res.json(doctor);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async list(req: express.Request, res: express.Response<DashboardDoctorListResponse>) {
		const { firstName, lastName, serviceId, page, limit } = validate(DashboardDoctorListQuerySchema, req.query);
		const result = await service.list({
			filters: { firstName, lastName, serviceId },
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

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async update(req: express.Request, res: express.Response) {
		const { id, firstName, lastName, email, phoneNumber, dateOfBirth, pesel, licenseNumber, specialization } =
			validate(DashboardDoctorUpdateSchema, req.body);

		const updatedDoctor = await service.update({
			id,
			update: { firstName, lastName, email, phoneNumber, dateOfBirth, pesel, licenseNumber, specialization },
		});
		res.json(updatedDoctor);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 5, windowMs: 15 * 60 * 1000 })
	async create(req: express.Request, res: express.Response<{ success: boolean }>) {
		const data = validate(DashboardDoctorSchema, req.body);
		const success = await service.create(data);

		res.status(201).json({ success });
	}

	async confirmInvitation(req: express.Request, res: express.Response<{ success: boolean }>) {
		const { token } = validate(DashboardDoctorConfirmInvitationSchema, req.body);
		const success = await service.confirmDoctorInvitation({ token });

		res.json({ success });
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async createSchedule(req: express.Request, res: express.Response<DashboardDoctorScheduleResponse>) {
		const data = validate(DashboardDoctorScheduleSchema, req.body);
		const schedule = await service.createSchedule(data);
		res.status(201).json(schedule);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async updateSchedule(req: express.Request, res: express.Response<DashboardDoctorScheduleResponse>) {
		const data = validate(DashboardDoctorScheduleUpdateSchema, req.body);
		const schedule = await service.updateSchedule(data);
		res.json(schedule);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async listSchedules(req: express.Request, res: express.Response<DashboardDoctorScheduleListResponse>) {
		const { doctorId, doctorName, page, limit } = validate(DashboardDoctorScheduleListQuerySchema, req.query);
		const result = await service.listSchedules({ filters: { doctorId, doctorName }, page, limit });
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
	async createScheduleException(
		req: express.Request,
		res: express.Response<DashboardDoctorScheduleExceptionResponse>,
	) {
		const exception = await service.createScheduleException(
			validate(DashboardDoctorScheduleExceptionSchema, req.body),
		);
		res.status(201).json(exception);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async updateScheduleException(
		req: express.Request,
		res: express.Response<DashboardDoctorScheduleExceptionResponse>,
	) {
		const exception = await service.updateScheduleException(
			validate(DashboardDoctorScheduleExceptionUpdateSchema, req.body),
		);
		res.json(exception);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async deleteScheduleException(req: express.Request, res: express.Response<{ success: boolean }>) {
		const { id } = validate(DashboardDoctorScheduleExceptionDeleteSchema, req.body);
		const success = await service.deleteScheduleException({ id });
		res.json({ success });
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async listScheduleExceptions(
		req: express.Request,
		res: express.Response<DashboardDoctorScheduleExceptionListResponse>,
	) {
		const { doctorId, page, limit } = validate(DashboardDoctorScheduleExceptionListQuerySchema, req.query);
		const result = await service.listScheduleExceptions({ doctorId, page, limit });
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

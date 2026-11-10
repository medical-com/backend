import type express from "express";

import {
	ConfirmDoctorInvitationSchema,
	CreateDoctorSchema,
	CreateDoctorScheduleExceptionSchema,
	DeleteDoctorScheduleExceptionSchema,
	ListDoctorScheduleExceptionsSchema,
	FindOneQuerySchema,
	CreateDoctorScheduleSchema,
	ListDoctorSchedulesSchema,
	ListQuerySchema,
	UpdateDoctorScheduleExceptionSchema,
	UpdateDoctorScheduleSchema,
	UpdateDoctorSchema,
} from "./types/doctor.schema";
import type {
	DoctorScheduleListResponse,
	DoctorScheduleExceptionResponse,
	DoctorScheduleExceptionListResponse,
	DoctorScheduleResponse,
	FindOneResponse,
	ListDoctorsResponse,
} from "./types/doctor.schema";
import { validate } from "@/core/security/validate";

import { dashboardDoctorService as service } from "./doctor.service";
import { RequireAuth } from "@/core/decorators/require-auth";
import { Throttle } from "@/core/decorators/throttle";
import { AccountRole } from "@/database/types/accounts.types";

export default class DashboardDoctorController {
	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async findOne(req: express.Request, res: express.Response<FindOneResponse>) {
		const { id } = validate(FindOneQuerySchema, req.query);

		const doctor = await service.findOne(id);

		if (!doctor) return;

		res.json(doctor);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async list(req: express.Request, res: express.Response<ListDoctorsResponse>) {
		const { firstName, lastName, serviceId, page, limit } = validate(ListQuerySchema, req.query);
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
			validate(UpdateDoctorSchema, req.body);

		const updatedDoctor = await service.update({
			id,
			update: { firstName, lastName, email, phoneNumber, dateOfBirth, pesel, licenseNumber, specialization },
		});
		res.json(updatedDoctor);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 5, windowMs: 15 * 60 * 1000 })
	async create(req: express.Request, res: express.Response<{ success: boolean }>) {
		const data = validate(CreateDoctorSchema, req.body);
		const success = await service.create(data);

		res.status(201).json({ success });
	}

	async confirmInvitation(req: express.Request, res: express.Response<{ success: boolean }>) {
		const { token } = validate(ConfirmDoctorInvitationSchema, req.body);
		const success = await service.confirmDoctorInvitation({ token });

		res.json({ success });
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async createSchedule(req: express.Request, res: express.Response<DoctorScheduleResponse>) {
		const data = validate(CreateDoctorScheduleSchema, req.body);
		const schedule = await service.createSchedule(data);
		res.status(201).json(schedule);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async updateSchedule(req: express.Request, res: express.Response<DoctorScheduleResponse>) {
		const data = validate(UpdateDoctorScheduleSchema, req.body);
		const schedule = await service.updateSchedule(data);
		res.json(schedule);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN, AccountRole.RECEPTIONIST] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async listSchedules(req: express.Request, res: express.Response<DoctorScheduleListResponse>) {
		const { doctorId, doctorName, page, limit } = validate(ListDoctorSchedulesSchema, req.query);
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
	async createScheduleException(req: express.Request, res: express.Response<DoctorScheduleExceptionResponse>) {
		const exception = await service.createScheduleException(
			validate(CreateDoctorScheduleExceptionSchema, req.body),
		);
		res.status(201).json(exception);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async updateScheduleException(req: express.Request, res: express.Response<DoctorScheduleExceptionResponse>) {
		const exception = await service.updateScheduleException(
			validate(UpdateDoctorScheduleExceptionSchema, req.body),
		);
		res.json(exception);
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async deleteScheduleException(req: express.Request, res: express.Response<{ success: boolean }>) {
		const { id } = validate(DeleteDoctorScheduleExceptionSchema, req.body);
		const success = await service.deleteScheduleException({ id });
		res.json({ success });
	}

	@RequireAuth({ roles: [AccountRole.ADMIN] })
	@Throttle({ limit: 10, windowMs: 1000 })
	async listScheduleExceptions(req: express.Request, res: express.Response<DoctorScheduleExceptionListResponse>) {
		const { doctorId, page, limit } = validate(ListDoctorScheduleExceptionsSchema, req.query);
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

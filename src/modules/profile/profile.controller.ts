import express from "express";
import { profileService as service } from "./profile.service";
import {
	ProfileFindOneAppointmentQuerySchema,
	ProfileFindOneAppointmentResponse,
	ProfileListAppointmentsQuerySchema,
	ProfileListAppointmentsResponse,
} from "./types/profile.schema";
import { RequireAuth } from "@/core/decorators/require-auth";
import { Throttle } from "@/core/decorators/throttle";
import { validate } from "@/core/security/validate";

class ProfileController {
	@RequireAuth()
	@Throttle({ limit: 30, windowMs: 1000 })
	async findOneAppointment(req: express.Request, res: express.Response<ProfileFindOneAppointmentResponse>) {
		const data = validate(ProfileFindOneAppointmentQuerySchema, req.query);
		const appointment = await service.findOneAppointment({
			accountId: req.account!.id,
			appointmentId: data.appointmentId,
		});

		res.json(appointment);
	}

	@RequireAuth()
	@Throttle({ limit: 30, windowMs: 1000 })
	async listAppointments(req: express.Request, res: express.Response<ProfileListAppointmentsResponse>) {
		const data = validate(ProfileListAppointmentsQuerySchema, req.query);
		const appointments = await service.listAppointments({
			accountId: req.account!.id,
			filters: {
				serviceName: data.serviceName,
				from: data.from,
				to: data.to,
			},
			page: data.page,
			limit: data.limit,
		});

		res.json(appointments);
	}

	@RequireAuth()
	@Throttle({ limit: 30, windowMs: 1000 })
	async cancelAppointment(req: express.Request, res: express.Response<{ success: boolean }>) {
		const data = validate(ProfileFindOneAppointmentQuerySchema, req.query);
		const result = await service.cancelAppointment({
			accountId: req.account!.id,
			appointmentId: data.appointmentId,
		});

		res.json(result);
	}
}

export const profileController = new ProfileController();

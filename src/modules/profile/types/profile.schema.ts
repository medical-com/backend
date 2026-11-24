import { ClientAppointmentDetailed } from "@/types/client/appointment.type";
import { WithPaginationResponse } from "@/types/pagination.type";
import { calendarDateSchema } from "@/types/zod.types";
import { z } from "zod";

export const ProfileListAppointmentsQuerySchema = z
	.strictObject({
		serviceName: z.string().optional(),
		from: calendarDateSchema.optional(),
		to: calendarDateSchema.optional(),
		page: z.coerce.number().int().min(1).optional(),
		limit: z.coerce.number().int().min(1).max(100).optional(),
	})
	.refine((data) => !data.from || !data.to || data.from <= data.to, {
		message: "The end date must not be before the start date",
		path: ["to"],
	});
export type ProfileListAppointmentsQuery = z.infer<typeof ProfileListAppointmentsQuerySchema>;
export type ProfileListAppointmentsResponse = WithPaginationResponse<ClientAppointmentDetailed>;

export const ProfileFindOneAppointmentQuerySchema = z.strictObject({
	appointmentId: z.uuid(),
});
export type ProfileFindOneAppointmentQuery = z.infer<typeof ProfileFindOneAppointmentQuerySchema>;
export type ProfileFindOneAppointmentResponse = ClientAppointmentDetailed;

export const ProfileCancelAppointmentQuerySchema = z.strictObject({
	appointmentId: z.uuid(),
});
export type ProfileCancelAppointmentQuery = z.infer<typeof ProfileCancelAppointmentQuerySchema>;
export type ProfileCancelAppointmentResponse = { success: boolean };

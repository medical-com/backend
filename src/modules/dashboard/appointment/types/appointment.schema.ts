import { AppointmentStatus } from "@/database/types/appointments.types";
import type { ClientAppointment, ClientAvailableDate } from "@/types/client/appointment.type";
import type { WithPaginationResponse } from "@/types/pagination.type";
import { calendarDateSchema, emailSchema, nameSchema, peselSchema, phoneNumberSchema } from "@/types/zod.types";
import { z } from "zod";

export const DashboardAppointmentListAvailableDatesQuerySchema = z
	.strictObject({
		serviceId: z.uuid(),
		doctorId: z.uuid().nullable().optional().default(null),
		from: calendarDateSchema.optional(),
		to: calendarDateSchema.optional(),
	})
	.refine((data) => !data.from || !data.to || data.from <= data.to, {
		message: "The end date must not be before the start date",
		path: ["to"],
	});
export type DashboardAppointmentListAvailableDatesQuery = z.infer<
	typeof DashboardAppointmentListAvailableDatesQuerySchema
>;
export type DashboardAppointmentListAvailableDatesResponse = {
	data: ClientAvailableDate[];
};

const DashboardAppointmentNewPatientSchema = z.strictObject({
	firstName: nameSchema,
	lastName: nameSchema,
	email: emailSchema,
	phoneNumber: phoneNumberSchema,
	dateOfBirth: z.iso.date().pipe(z.coerce.date()),
	pesel: peselSchema,
});

export const DashboardAppointmentSchema = z
	.strictObject({
		serviceId: z.uuid(),
		doctorId: z.uuid().nullable().optional().default(null),
		patientId: z.uuid().nullable().optional().default(null),
		date: calendarDateSchema,
		time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid appointment time"),
		newPatient: DashboardAppointmentNewPatientSchema.optional(),
		notes: z.string().trim().max(5000).optional().default(""),
		notification: z.boolean().optional().default(true),
	})
	.refine((data) => Boolean(data.patientId) !== Boolean(data.newPatient), {
		message: "Provide either patientId or newPatient",
		path: ["patientId"],
	});
export type DashboardAppointment = z.infer<typeof DashboardAppointmentSchema>;

export const DashboardAppointmentListQuerySchema = z.strictObject({
	doctorId: z.uuid().optional(),
	serviceId: z.uuid().optional(),
	patientName: z.string().trim().min(1).max(100).optional(),
	patientEmail: z.string().trim().min(1).max(320).optional(),
	patientPhone: z.string().trim().min(1).max(50).optional(),
	patientPesel: z.string().trim().min(1).max(11).optional(),
	status: z.enum(AppointmentStatus).optional(),
	from: calendarDateSchema.optional(),
	to: calendarDateSchema.optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type DashboardAppointmentListQuery = z.infer<typeof DashboardAppointmentListQuerySchema>;
export type DashboardAppointmentListResponse = WithPaginationResponse<ClientAppointment>;

export const DashboardAppointmentFindOneQuerySchema = z.strictObject({ id: z.uuid() });
export type DashboardAppointmentFindOneResponse = ClientAppointment;

export const DashboardAppointmentUpdateStatusSchema = z.object({
	id: z.uuid(),
	status: z.enum(AppointmentStatus),
});
export type DashboardAppointmentUpdateStatus = z.infer<typeof DashboardAppointmentUpdateStatusSchema>;
export type DashboardAppointmentUpdateStatusResponse = { status: AppointmentStatus };

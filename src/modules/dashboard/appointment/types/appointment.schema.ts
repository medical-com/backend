import { ClientAvailableDate } from "@/types/client/appointments.types";
import type { ClientAppointment } from "@/types/client/appointment.type";
import type { WithPaginationResponse } from "@/types/pagination.type";
import { calendarDateSchema, emailSchema, nameSchema, peselSchema, phoneNumberSchema } from "@/types/zod.types";
import { z } from "zod";

export const ListAvailableDatesQuerySchema = z
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
export type ListAvailableDatesQuery = z.infer<typeof ListAvailableDatesQuerySchema>;
export type ListAvailableDatesResponse = {
	data: ClientAvailableDate[];
};

const NewAppointmentPatientSchema = z.strictObject({
	firstName: nameSchema,
	lastName: nameSchema,
	email: emailSchema,
	phoneNumber: phoneNumberSchema,
	dateOfBirth: z.iso.date().pipe(z.coerce.date()),
	pesel: peselSchema,
});

export const CreateAppointmentSchema = z
	.strictObject({
		serviceId: z.uuid(),
		doctorId: z.uuid().nullable().optional().default(null),
		patientId: z.uuid().nullable().optional().default(null),
		date: calendarDateSchema,
		time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid appointment time"),
		newPatient: NewAppointmentPatientSchema.optional(),
		notes: z.string().trim().max(5000).optional().default(""),
		notification: z.boolean().optional().default(true),
	})
	.refine((data) => Boolean(data.patientId) !== Boolean(data.newPatient), {
		message: "Provide either patientId or newPatient",
		path: ["patientId"],
	});
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;

export const ListAppointmentsQuerySchema = z.strictObject({
	doctorId: z.uuid().optional(),
	serviceId: z.uuid().optional(),
	patientName: z.string().trim().min(1).max(100).optional(),
	from: calendarDateSchema.optional(),
	to: calendarDateSchema.optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ListAppointmentsQuery = z.infer<typeof ListAppointmentsQuerySchema>;
export const FindOneAppointmentQuerySchema = z.strictObject({ id: z.uuid() });
export type ListAppointmentsResponse = WithPaginationResponse<ClientAppointment>;
export type FindOneAppointmentResponse = ClientAppointment;

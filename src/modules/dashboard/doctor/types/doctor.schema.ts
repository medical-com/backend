import type { ClientDoctor, ClientDoctorSchedule } from "@/types/client/doctor.type";
import type { ClientDoctorScheduleException } from "@/types/client/doctor.type";
import { DoctorScheduleExceptionType } from "@/database/types";
import type { WithPaginationResponse } from "@/types/pagination.type";
import {
	dateSchema,
	dateTimeSchema,
	calendarDateSchema,
	emailSchema,
	nameSchema,
	peselSchema,
	phoneNumberSchema,
} from "@/types/zod.types";
import { z } from "zod";

export const FindOneQuerySchema = z.strictObject({
	id: z.uuid(),
});
export type FindOneQuery = z.infer<typeof FindOneQuerySchema>;

export type FindOneResponse = ClientDoctor;

export const ListQuerySchema = z.strictObject({
	firstName: nameSchema.optional(),
	lastName: nameSchema.optional(),
	serviceId: z.uuid().optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ListQuery = z.infer<typeof ListQuerySchema>;

export type ListDoctorsResponse = WithPaginationResponse<ClientDoctor>;

export const CreateDoctorSchema = z.strictObject({
	firstName: nameSchema,
	lastName: nameSchema,
	pesel: peselSchema,
	email: emailSchema,
	phoneNumber: phoneNumberSchema,
	dateOfBirth: dateSchema,
	licenseNumber: z.string().trim().min(1).max(100),
	specialization: z.string().trim().min(1).max(100),
});
export type CreateDoctor = z.infer<typeof CreateDoctorSchema>;

export const ConfirmDoctorInvitationSchema = z.strictObject({
	token: z.uuid(),
});

export const UpdateDoctorSchema = z
	.strictObject({
		id: z.uuid(),
		firstName: nameSchema.optional(),
		lastName: nameSchema.optional(),
		email: emailSchema.optional(),
		phoneNumber: phoneNumberSchema.optional(),
		dateOfBirth: dateSchema.optional(),
		pesel: peselSchema.optional(),
		licenseNumber: z.string().trim().min(1).max(100).optional(),
		specialization: z.string().trim().min(1).max(100).optional(),
	})
	.refine((data) => Object.keys(data).length > 1, {
		message: "At least one doctor field must be provided",
	});
export type UpdateDoctor = z.infer<typeof UpdateDoctorSchema>;
export type UpdateDoctorResponse = ClientDoctor;

const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Invalid time");

export const CreateDoctorScheduleSchema = z
	.strictObject({
		doctorId: z.uuid(),
		dayOfWeek: z.coerce.number().int().min(1).max(7),
		startTime: timeSchema,
		endTime: timeSchema,
		validFrom: calendarDateSchema,
		validTo: calendarDateSchema.nullable().optional(),
	})
	.refine((data) => data.startTime < data.endTime, {
		message: "Start time must be before end time",
		path: ["endTime"],
	})
	.refine((data) => !data.validTo || data.validTo >= data.validFrom, {
		message: "Valid-to date must not be before valid-from date",
		path: ["validTo"],
	});
export type CreateDoctorSchedule = z.infer<typeof CreateDoctorScheduleSchema>;

export const UpdateDoctorScheduleSchema = z
	.strictObject({
		id: z.uuid(),
		doctorId: z.uuid().optional(),
		dayOfWeek: z.coerce.number().int().min(1).max(7).optional(),
		startTime: timeSchema.optional(),
		endTime: timeSchema.optional(),
		validFrom: calendarDateSchema.optional(),
		validTo: calendarDateSchema.nullable().optional(),
	})
	.refine(
		(data) =>
			(data.startTime === undefined || data.endTime === undefined || data.startTime < data.endTime) &&
			(data.validFrom === undefined ||
				data.validTo === undefined ||
				data.validTo === null ||
				data.validTo >= data.validFrom),
		{ message: "Invalid schedule time or date range" },
	);
export type UpdateDoctorSchedule = z.infer<typeof UpdateDoctorScheduleSchema>;

export const ListDoctorSchedulesSchema = z.strictObject({
	doctorId: z.uuid().optional(),
	doctorName: z.string().trim().min(1).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ListDoctorSchedules = z.infer<typeof ListDoctorSchedulesSchema>;
export type DoctorScheduleResponse = ClientDoctorSchedule;
export type DoctorScheduleListResponse = WithPaginationResponse<ClientDoctorSchedule>;

export const CreateDoctorScheduleExceptionSchema = z
	.strictObject({
		doctorId: z.uuid(),
		startAt: dateTimeSchema,
		endAt: dateTimeSchema,
		type: z.enum(DoctorScheduleExceptionType),
		reason: z.string().trim().max(255).nullable().optional(),
	})
	.refine((data) => data.startAt < data.endAt, {
		message: "Start date-time must be before end date-time",
		path: ["endAt"],
	});
export type CreateDoctorScheduleException = z.infer<typeof CreateDoctorScheduleExceptionSchema>;

export const UpdateDoctorScheduleExceptionSchema = z
	.strictObject({
		id: z.uuid(),
		doctorId: z.uuid().optional(),
		startAt: dateTimeSchema.optional(),
		endAt: dateTimeSchema.optional(),
		type: z.enum(DoctorScheduleExceptionType).optional(),
		reason: z.string().trim().max(255).nullable().optional(),
	})
	.refine((data) => data.startAt === undefined || data.endAt === undefined || data.startAt < data.endAt, {
		message: "Start date-time must be before end date-time",
		path: ["endAt"],
	});
export type UpdateDoctorScheduleException = z.infer<typeof UpdateDoctorScheduleExceptionSchema>;

export const DeleteDoctorScheduleExceptionSchema = z.strictObject({
	id: z.uuid(),
});
export const ListDoctorScheduleExceptionsSchema = z.strictObject({
	doctorId: z.uuid(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type DeleteDoctorScheduleExceptionResponse = { success: boolean };
export type DoctorScheduleExceptionResponse = ClientDoctorScheduleException;
export type DoctorScheduleExceptionListResponse = WithPaginationResponse<ClientDoctorScheduleException>;

import type { ClientDoctor, ClientDoctorSchedule } from "@/types/client/doctor.type";
import type { ClientDoctorScheduleException } from "@/types/client/doctor.type";
import { DoctorScheduleExceptionType } from "@/database/types";
import type { WithPaginationResponse } from "@/types/pagination.type";
import { phoneNumberSchema } from "@/types/zod.types";
import { z } from "zod";

export const FindOneQuerySchema = z.object({
	id: z.uuid(),
});
export type FindOneQuery = z.infer<typeof FindOneQuerySchema>;

export type FindOneResponse = ClientDoctor;

export const ListQuerySchema = z.object({
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ListQuery = z.infer<typeof ListQuerySchema>;

export type ListDoctorsResponse = WithPaginationResponse<ClientDoctor>;

export const CreateDoctorSchema = z.object({
	firstName: z.string().trim().min(1),
	lastName: z.string().trim().min(1),
	pesel: z.string().trim().length(11).regex(/^\d+$/),
	email: z.email(),
	phoneNumber: phoneNumberSchema,
	dateOfBirth: z.coerce.date(),
	licenseNumber: z.string().trim().min(1),
	specialization: z.string().trim().min(1),
});
export type CreateDoctor = z.infer<typeof CreateDoctorSchema>;

export const ConfirmDoctorInvitationSchema = z.object({
	token: z.uuid(),
});

export const UpdateDoctorSchema = z.object({
	id: z.uuid(),
	firstName: z.string().trim().min(1).optional(),
	lastName: z.string().trim().min(1).optional(),
	email: z.email().optional(),
	phoneNumber: phoneNumberSchema.optional(),
	dateOfBirth: z.coerce.date().optional(),
	pesel: z.string().trim().min(1).optional(),
	licenseNumber: z.string().trim().min(1).optional(),
	specialization: z.string().trim().min(1).optional(),
});
export type UpdateDoctor = z.infer<typeof UpdateDoctorSchema>;
export type UpdateDoctorResponse = ClientDoctor;

const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Invalid time");

export const CreateDoctorScheduleSchema = z
	.object({
		doctorId: z.uuid(),
		dayOfWeek: z.coerce.number().int().min(1).max(7),
		startTime: timeSchema,
		endTime: timeSchema,
		validFrom: z.coerce.date(),
		validTo: z.coerce.date().nullable().optional(),
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
	.object({
		id: z.uuid(),
		doctorId: z.uuid().optional(),
		dayOfWeek: z.coerce.number().int().min(1).max(7).optional(),
		startTime: timeSchema.optional(),
		endTime: timeSchema.optional(),
		validFrom: z.coerce.date().optional(),
		validTo: z.coerce.date().nullable().optional(),
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

export const ListDoctorSchedulesSchema = z.object({
	doctorId: z.uuid().optional(),
	doctorName: z.string().trim().min(1).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ListDoctorSchedules = z.infer<typeof ListDoctorSchedulesSchema>;
export type DoctorScheduleResponse = ClientDoctorSchedule;
export type DoctorScheduleListResponse = WithPaginationResponse<ClientDoctorSchedule>;

export const CreateDoctorScheduleExceptionSchema = z
	.object({
		doctorId: z.uuid(),
		startAt: z.coerce.date(),
		endAt: z.coerce.date(),
		type: z.enum(DoctorScheduleExceptionType),
		reason: z.string().trim().max(255).nullable().optional(),
	})
	.refine((data) => data.startAt < data.endAt, {
		message: "Start date-time must be before end date-time",
		path: ["endAt"],
	});
export type CreateDoctorScheduleException = z.infer<typeof CreateDoctorScheduleExceptionSchema>;

export const UpdateDoctorScheduleExceptionSchema = z
	.object({
		id: z.uuid(),
		doctorId: z.uuid().optional(),
		startAt: z.coerce.date().optional(),
		endAt: z.coerce.date().optional(),
		type: z.enum(DoctorScheduleExceptionType).optional(),
		reason: z.string().trim().max(255).nullable().optional(),
	})
	.refine((data) => data.startAt === undefined || data.endAt === undefined || data.startAt < data.endAt, {
		message: "Start date-time must be before end date-time",
		path: ["endAt"],
	});
export type UpdateDoctorScheduleException = z.infer<typeof UpdateDoctorScheduleExceptionSchema>;

export const DeleteDoctorScheduleExceptionSchema = z.object({
	id: z.uuid(),
});
export const ListDoctorScheduleExceptionsSchema = z.object({
	doctorId: z.uuid(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type DeleteDoctorScheduleExceptionResponse = { success: boolean };
export type DoctorScheduleExceptionResponse = ClientDoctorScheduleException;
export type DoctorScheduleExceptionListResponse = WithPaginationResponse<ClientDoctorScheduleException>;

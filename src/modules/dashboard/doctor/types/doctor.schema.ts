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

export const DashboardDoctorFindOneQuerySchema = z.strictObject({
	id: z.uuid(),
});
export type DashboardDoctorFindOneQuery = z.infer<typeof DashboardDoctorFindOneQuerySchema>;

export type DashboardDoctorFindOneResponse = ClientDoctor;

export const DashboardDoctorListQuerySchema = z.strictObject({
	firstName: nameSchema.optional(),
	lastName: nameSchema.optional(),
	serviceId: z.uuid().optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type DashboardDoctorListQuery = z.infer<typeof DashboardDoctorListQuerySchema>;

export type DashboardDoctorListResponse = WithPaginationResponse<ClientDoctor>;

export const DashboardDoctorSchema = z.strictObject({
	firstName: nameSchema,
	lastName: nameSchema,
	pesel: peselSchema,
	email: emailSchema,
	phoneNumber: phoneNumberSchema,
	dateOfBirth: dateSchema,
	licenseNumber: z.string().trim().min(1).max(100),
	specialization: z.string().trim().min(1).max(100),
});
export type DashboardDoctor = z.infer<typeof DashboardDoctorSchema>;

export const DashboardDoctorConfirmInvitationSchema = z.strictObject({
	token: z.uuid(),
});

export const DashboardDoctorUpdateSchema = z
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
export type DashboardDoctorUpdate = z.infer<typeof DashboardDoctorUpdateSchema>;
export type DashboardDoctorUpdateResponse = ClientDoctor;

const DashboardDoctorTimeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Invalid time");

export const DashboardDoctorScheduleSchema = z
	.strictObject({
		doctorId: z.uuid(),
		dayOfWeek: z.coerce.number().int().min(1).max(7),
		startTime: DashboardDoctorTimeSchema,
		endTime: DashboardDoctorTimeSchema,
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
export type DashboardDoctorSchedule = z.infer<typeof DashboardDoctorScheduleSchema>;

export const DashboardDoctorScheduleUpdateSchema = z
	.strictObject({
		id: z.uuid(),
		doctorId: z.uuid().optional(),
		dayOfWeek: z.coerce.number().int().min(1).max(7).optional(),
		startTime: DashboardDoctorTimeSchema.optional(),
		endTime: DashboardDoctorTimeSchema.optional(),
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
export type DashboardDoctorScheduleUpdate = z.infer<typeof DashboardDoctorScheduleUpdateSchema>;

export const DashboardDoctorScheduleListQuerySchema = z.strictObject({
	doctorId: z.uuid().optional(),
	doctorName: z.string().trim().min(1).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type DashboardDoctorScheduleListQuery = z.infer<typeof DashboardDoctorScheduleListQuerySchema>;
export type DashboardDoctorScheduleResponse = ClientDoctorSchedule;
export type DashboardDoctorScheduleListResponse = WithPaginationResponse<ClientDoctorSchedule>;

export const DashboardDoctorScheduleExceptionSchema = z
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
export type DashboardDoctorScheduleException = z.infer<typeof DashboardDoctorScheduleExceptionSchema>;

export const DashboardDoctorScheduleExceptionUpdateSchema = z
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
export type DashboardDoctorScheduleExceptionUpdate = z.infer<typeof DashboardDoctorScheduleExceptionUpdateSchema>;

export const DashboardDoctorScheduleExceptionDeleteSchema = z.strictObject({
	id: z.uuid(),
});
export const DashboardDoctorScheduleExceptionListQuerySchema = z.strictObject({
	doctorId: z.uuid(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type DashboardDoctorScheduleExceptionDeleteResponse = { success: boolean };
export type DashboardDoctorScheduleExceptionResponse = ClientDoctorScheduleException;
export type DashboardDoctorScheduleExceptionListResponse = WithPaginationResponse<ClientDoctorScheduleException>;

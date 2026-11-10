import type { ClientPatient } from "@/types/client/patient.type";
import type { WithPaginationResponse } from "@/types/pagination.type";
import {
	dateSchema,
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
export type FindOneResponse = ClientPatient;

export const DashboardPatientListQuerySchema = z.strictObject({
	name: nameSchema.optional(),
	email: emailSchema.optional(),
	phoneNumber: z.string().trim().min(1).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type DashboardPatientListQuery = z.infer<typeof DashboardPatientListQuerySchema>;
export type DashboardPatientListResponse = WithPaginationResponse<ClientPatient>;

export const CreatePatientSchema = z.strictObject({
	firstName: nameSchema,
	lastName: nameSchema,
	email: emailSchema,
	phoneNumber: phoneNumberSchema,
	dateOfBirth: dateSchema,
	pesel: peselSchema,
});
export type CreatePatient = z.infer<typeof CreatePatientSchema>;
export type CreatePatientResponse = ClientPatient;

export const DashboardPatientUpdateSchema = z
	.strictObject({
	id: z.uuid(),
	firstName: nameSchema.optional(),
	lastName: nameSchema.optional(),
	email: emailSchema.optional(),
	phoneNumber: phoneNumberSchema.optional(),
	dateOfBirth: dateSchema.optional(),
	pesel: peselSchema.optional(),
	})
	.refine((data) => Object.keys(data).length > 1, {
		message: "At least one patient field must be provided",
	});
export type DashboardPatientUpdate = z.infer<typeof DashboardPatientUpdateSchema>;
export type DashboardPatientUpdateResponse = ClientPatient;

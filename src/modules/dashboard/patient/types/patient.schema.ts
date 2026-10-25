import type { ClientPatient } from "@/types/client/patient.type";
import type { WithPaginationResponse } from "@/types/pagination.type";
import { phoneNumberSchema } from "@/types/zod.types";
import { z } from "zod";

export const FindOneQuerySchema = z.object({
	id: z.uuid(),
});
export type FindOneQuery = z.infer<typeof FindOneQuerySchema>;
export type FindOneResponse = ClientPatient;

export const DashboardPatientListQuerySchema = z.object({
	name: z.string().trim().min(1).optional(),
	email: z.string().trim().min(1).optional(),
	phoneNumber: z.string().trim().min(1).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type DashboardPatientListQuery = z.infer<typeof DashboardPatientListQuerySchema>;
export type DashboardPatientListResponse = WithPaginationResponse<ClientPatient>;

export const DashboardPatientUpdateSchema = z.object({
	id: z.uuid(),
	firstName: z.string().trim().min(1).optional(),
	lastName: z.string().trim().min(1).optional(),
	email: z.email().optional(),
	phoneNumber: phoneNumberSchema.optional(),
	dateOfBirth: z.coerce.date().optional(),
	pesel: z.string().trim().min(1).optional(),
});
export type DashboardPatientUpdate = z.infer<typeof DashboardPatientUpdateSchema>;
export type DashboardPatientUpdateResponse = ClientPatient;

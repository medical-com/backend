import { ClientPatient } from "@/types/client/patient.type";
import { WithPaginationResponse } from "@/types/pagination.type";
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

import type { ClientService } from "@/types/client/service.type";
import type { WithPaginationResponse } from "@/types/pagination.type";
import { ServiceCategory } from "@/database/types";
import { z } from "zod";

export const DashboardServiceFindOneQuerySchema = z.strictObject({
	id: z.uuid(),
});
export type DashboardServiceFindOneResponse = ClientService;

export const DashboardServiceListQuerySchema = z.strictObject({
	name: z.string().trim().min(1).max(255).optional(),
	category: z.enum(ServiceCategory).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type DashboardServiceListResponse = WithPaginationResponse<ClientService>;

export const DashboardServiceSchema = z.strictObject({
	name: z.string().trim().min(1).max(255),
	description: z.string().trim().min(1).max(255),
	category: z.enum(ServiceCategory),
	duration: z.coerce.number().int().positive(),
	doctorIds: z.array(z.uuid()),
});
export type DashboardService = z.infer<typeof DashboardServiceSchema>;
export type DashboardServiceResponse = ClientService;

export const DashboardServiceUpdateSchema = z
	.strictObject({
		id: z.uuid(),
		name: z.string().trim().min(1).max(255).optional(),
		description: z.string().trim().min(1).max(255).optional(),
		category: z.enum(ServiceCategory).optional(),
		duration: z.coerce.number().int().positive().optional(),
		doctorIds: z.array(z.uuid()).optional(),
	})
	.refine((data) => Object.keys(data).length > 1, {
		message: "At least one service field must be provided",
	});
export type DashboardServiceUpdate = z.infer<typeof DashboardServiceUpdateSchema>;
export type DashboardServiceUpdateResponse = ClientService;

export const DashboardServiceDeleteSchema = z.strictObject({ id: z.uuid() });
export type DashboardServiceDeleteResponse = { success: boolean };

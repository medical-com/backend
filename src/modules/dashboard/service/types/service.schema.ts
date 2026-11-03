import type { ClientService } from "@/types/client/service.type";
import type { WithPaginationResponse } from "@/types/pagination.type";
import { ServiceCategory } from "@/database/types";
import { z } from "zod";

export const FindOneServiceQuerySchema = z.strictObject({
	id: z.uuid(),
});
export type FindOneServiceResponse = ClientService;

export const ListServiceQuerySchema = z.strictObject({
	name: z.string().trim().min(1).max(16).optional(),
	category: z.enum(ServiceCategory).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ListServiceResponse = WithPaginationResponse<ClientService>;

export const CreateServiceSchema = z.strictObject({
	name: z.string().trim().min(1).max(16),
	description: z.string().trim().min(1).max(255),
	category: z.enum(ServiceCategory),
	duration: z.coerce.number().int().positive(),
	doctorIds: z.array(z.uuid()),
});
export type CreateService = z.infer<typeof CreateServiceSchema>;
export type CreateServiceResponse = ClientService;

export const UpdateServiceSchema = z
	.strictObject({
	id: z.uuid(),
	name: z.string().trim().min(1).max(16).optional(),
	description: z.string().trim().min(1).max(255).optional(),
	category: z.enum(ServiceCategory).optional(),
	duration: z.coerce.number().int().positive().optional(),
	doctorIds: z.array(z.uuid()).optional(),
	})
	.refine((data) => Object.keys(data).length > 1, {
		message: "At least one service field must be provided",
	});
export type UpdateService = z.infer<typeof UpdateServiceSchema>;
export type UpdateServiceResponse = ClientService;

export const DeleteServiceSchema = z.strictObject({ id: z.uuid() });
export type DeleteServiceResponse = { success: boolean };

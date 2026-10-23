import type { ClientDoctor } from "@/types/client/doctor.type";
import type { WithPaginationResponse } from "@/types/pagination.type";
import { z } from "zod";

export const FindOneQuerySchema = z.object({
	id: z.uuid(),
});
export type FindOneQuery = z.infer<typeof FindOneQuerySchema>;

export type FindOneResponse = ClientDoctor;

export const ListQuerySchema = z.object({
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	page: z.coerce.number().optional(),
	limit: z.coerce.number().optional(),
});
export type ListQuery = z.infer<typeof ListQuerySchema>;

export type ListDoctorsResponse = WithPaginationResponse<ClientDoctor>;

import type { ClientDoctor } from "@/types/client/doctor.type";
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

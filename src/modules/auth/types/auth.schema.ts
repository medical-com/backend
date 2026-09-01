import { z } from "zod";

export const registerSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.email(),
	dateOfBirth: z.string().min(1),
	phoneNumber: z.string().min(1),
	password: z.string().min(8),
});

export const loginSchema = z.object({
	email: z.string().min(1),
	password: z.string().min(1),
});

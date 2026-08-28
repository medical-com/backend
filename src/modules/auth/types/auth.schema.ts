import { z } from "zod";

export const registerSchema = z.object({
	email: z.email(),
	username: z.string().min(3).max(32),
	password: z.string().min(8),
});

export const loginSchema = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
});

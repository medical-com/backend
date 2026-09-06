import type { ClientAccount } from "@/types/client/account.type";
import { z } from "zod";

export const RegisterRequestSchema = z.object({
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.email(),
	pesel: z.string().length(11).regex(/^\d+$/),
	dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	phoneNumber: z.string().min(1),
	password: z.string().min(8),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = {
	success: boolean;
};

export const LoginRequestSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = {
	account: ClientAccount;
	token?: string;
};

export type MeResponse = {
	data: ClientAccount;
};

export const ConfirmEmailRequestSchema = z.object({
	token: z.string().length(6).regex(/^\d+$/),
});
export type ConfirmEmailRequest = z.infer<typeof ConfirmEmailRequestSchema>;
export type ConfirmEmailResponse = {
	success: boolean;
};

export const ForgotPasswordRequestSchema = z.object({
	email: z.email(),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
export type ForgotPasswordResponse = {
	success: boolean;
};

export const ResetPasswordRequestSchema = z.object({
	token: z.uuid(),
	password: z.string().min(8),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ResetPasswordResponse = {
	success: boolean;
};

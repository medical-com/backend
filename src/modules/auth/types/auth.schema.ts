import type { ClientAccount } from "@/types/client/account.type";
import {
	dateOnlyStringSchema,
	emailSchema,
	nameSchema,
	peselSchema,
	phoneNumberSchema,
} from "@/types/zod.types";
import { z } from "zod";

export const RegisterRequestSchema = z.strictObject({
	firstName: nameSchema,
	lastName: nameSchema,
	email: emailSchema,
	pesel: peselSchema,
	dateOfBirth: dateOnlyStringSchema,
	phoneNumber: phoneNumberSchema,
	password: z.string().min(8).max(72),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = {
	success: boolean;
};

export const LoginRequestSchema = z.strictObject({
	email: emailSchema,
	password: z.string().min(1).max(72),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = {
	clientAccount: ClientAccount;
};

export type MeResponse = {
	data: ClientAccount | null;
};

export const ConfirmEmailRequestSchema = z.strictObject({
	token: z.string().length(6).regex(/^\d+$/),
});
export type ConfirmEmailRequest = z.infer<typeof ConfirmEmailRequestSchema>;
export type ConfirmEmailResponse = {
	success: boolean;
};

export const ForgotPasswordRequestSchema = z.strictObject({
	email: emailSchema,
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
export type ForgotPasswordResponse = {
	success: boolean;
};

export const ResetPasswordRequestSchema = z.strictObject({
	token: z.uuid(),
	password: z.string().min(8).max(72),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type ResetPasswordResponse = {
	success: boolean;
};

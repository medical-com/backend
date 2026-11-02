import { z } from "zod";

export const envSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	CLIENT_URL: z.url().default("http://localhost:5173"),

	DB_HOST: z.string().trim().min(1),
	DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
	DB_NAME: z.string().trim().min(1),
	DB_USER: z.string().trim().min(1),
	DB_PASSWORD: z.string().min(1),

	REDIS_URL: z.url().default("redis://localhost:6379"),

	MAIL_SEND_DISABLED: z
		.enum(["true", "false"])
		.default("false")
		.transform((value) => value === "true"),
	MAIL_RESEND_DISABLED: z
		.enum(["true", "false"])
		.default("false")
		.transform((value) => value === "true"),
	RESEND_API_KEY: z.string().min(1),
	MAIL_FROM: z.string().trim().min(1),
});

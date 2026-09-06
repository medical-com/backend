import { z } from "zod";

export const envSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

	PORT: z.coerce.number().int().positive().default(3000),
	CLIENT_URL: z.url().default("http://localhost:5173"),

	DB_HOST: z.string().min(1),
	DB_PORT: z.coerce.number().int().positive().default(5432),
	DB_NAME: z.string().min(1),
	DB_USER: z.string().min(1),
	DB_PASSWORD: z.string().min(1),

	REDIS_URL: z.url().default("redis://localhost:6379"),

	MAIL_RESEND_DISABLED: z
		.string()
		.default("false")
		.transform((value) => value === "true"),
	RESEND_API_KEY: z.string(),
	MAIL_FROM: z.string(),
});

import { z } from "zod";

export const envSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

	PORT: z.coerce.number().int().positive().default(3000),

	DB_HOST: z.string().min(1),
	DB_PORT: z.coerce.number().int().positive().default(5432),
	DB_NAME: z.string().min(1),
	DB_USER: z.string().min(1),
	DB_PASSWORD: z.string().min(1),

	REDIS_URL: z.url().default("redis://localhost:6379"),

	
});

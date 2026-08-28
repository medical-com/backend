import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";
import { envSchema } from "./env.schema.ts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve .env from the project root by file location, not process.cwd() -
// knex's CLI chdirs into src/database before requiring the knexfile, which
// would otherwise break the default cwd-relative dotenv lookup.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const result = envSchema.safeParse(process.env);
if (!result.success) {
	console.error("Invalid environment variables");
	console.error(z.prettifyError(result.error));

	process.exit(1);
}

const env = result.data;
export const config = {
	env: env.NODE_ENV,
	port: env.PORT,

	database: {
		host: env.DB_HOST,
		port: env.DB_PORT,
		name: env.DB_NAME,
		user: env.DB_USER,
		password: env.DB_PASSWORD,
	},

	redis: {
		url: env.REDIS_URL,
	},
} as const;

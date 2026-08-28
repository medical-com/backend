import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "@/core/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
	client: "pg",
	connection: {
		host: config.database.host,
		user: config.database.user,
		password: config.database.password,
		database: config.database.name,
		port: config.database.port,
		pool: {
			min: 10,
			max: 30,
		},
	},
	migrations: {
		tableName: "knex_migrations",
		directory: path.resolve(__dirname, "./migrations"),
	},
	seeds: {
		directory: path.resolve(__dirname, "./seeds"),
	},
};

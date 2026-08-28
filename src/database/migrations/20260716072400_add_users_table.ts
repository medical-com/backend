import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.withSchema("public").createTable("users", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table.text("username").notNullable().unique();
		table.text("password").notNullable();
		table.text("email").notNullable();
		table
			.enum("role", ["owner", "manager", "doctor", "patient"], {
				useNative: true,
				enumName: "user_role",
				schemaName: "public",
			})
			.defaultTo("patient")
			.notNullable();
		table.text("permissions").notNullable().defaultTo("[]");
		table
			.enum("auth_provider", ["local"], {
				useNative: true,
				enumName: "auth_provider",
				schemaName: "public",
			})
			.notNullable();
		table.timestamp("last_login_at").notNullable().defaultTo(knex.fn.now());
		table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
		table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.withSchema("public").dropTable("users");
}

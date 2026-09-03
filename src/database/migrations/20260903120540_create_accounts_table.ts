import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("accounts", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table.uuid("person_id").notNullable().unique().references("id").inTable("persons").onDelete("CASCADE");
		table.string("email", 255).notNullable().unique();
		table.boolean("email_verified").notNullable().defaultTo(false);
		table.string("password_hash", 255).notNullable();
		table.timestamp("last_login_at", { useTz: true }).nullable();
		table
			.enum("role", ["admin", "receptionist", "doctor", "patient"], {
				useNative: true,
				enumName: "account_group",
				schemaName: "public",
			})
			.notNullable();
		table
			.enum("status", ["invited", "active", "disabled"], {
				useNative: true,
				enumName: "account_status",
				schemaName: "public",
			})
			.notNullable();
		table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
		table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists("accounts");
}

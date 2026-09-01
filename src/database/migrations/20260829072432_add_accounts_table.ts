import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.withSchema("public").createTable("accounts", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table.uuid("patient_id").notNullable();
		table.text("email").notNullable().unique();
		table.boolean("email_verified").notNullable().defaultTo(false);
		table.text("password_hash").notNullable();
		table
			.enum("group", ["admin", "receptionist", "doctor", "patient"], {
				useNative: true,
				enumName: "account_group",
				schemaName: "public",
			})
			.notNullable();
		table.text("permissions").nullable().defaultTo("[]");
		table.timestamp("last_login_at").notNullable().defaultTo(knex.fn.now());
		table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
		table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.withSchema("public").dropTable("accounts");
}

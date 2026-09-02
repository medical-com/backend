import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.withSchema("public").createTable("patients", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table.text("first_name").notNullable();
		table.text("last_name").notNullable();
		table.date("date_of_birth").notNullable();
		table.text("phone_number").notNullable().unique();
		table.text("email").notNullable().unique();
		table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
		table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.withSchema("public").dropTable("patients");
}

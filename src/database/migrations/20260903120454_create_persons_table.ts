import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("persons", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table.string("first_name", 100).notNullable();
		table.string("last_name", 100).notNullable();
		table.string("pesel", 11).unique();
		table.string("email", 255).notNullable().unique();
		table.string("phone", 30).notNullable().unique();
		table.date("date_of_birth").notNullable();
		table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
		table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists("persons");
}

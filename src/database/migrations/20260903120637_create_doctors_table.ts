import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("doctors", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table.uuid("person_id").notNullable().unique().references("id").inTable("persons").onDelete("CASCADE");
		table.string("license_number", 50).unique().notNullable();
		table.string("specialization", 150).notNullable();
		table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
		table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists("doctors");
}

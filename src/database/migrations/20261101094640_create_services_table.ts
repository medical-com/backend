import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("services", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table.string("name").notNullable();
		table.text("description").notNullable();
		table
			.enum(
				"category",
				["general", "specialist", "surgery", "dental", "vision", "mental_health", "physical_therapy"],
				{
					useNative: true,
					enumName: "service_category_enum",
					schemaName: "public",
				},
			)
			.notNullable();
		table.integer("duration").notNullable(); // Duration in minutes
		table.specificType("doctor_ids", "uuid[]").notNullable(); // Array of doctor IDs
		table.timestamp("created_at").defaultTo(knex.fn.now());
		table.timestamp("updated_at").defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("services");
}

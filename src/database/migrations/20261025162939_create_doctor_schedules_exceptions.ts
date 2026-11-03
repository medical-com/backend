import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("doctor_schedule_exceptions", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table.uuid("doctor_id").notNullable().references("id").inTable("doctors").onDelete("CASCADE");
		table.timestamp("start_at", { useTz: true }).notNullable();
		table.timestamp("end_at", { useTz: true }).notNullable();
		table
			.enum("type", ["available", "unavailable"], {
				useNative: true,
				enumName: "doctor_schedule_exception_type",
				schemaName: "public",
			})
			.notNullable();
		table.string("reason", 255).nullable();
		table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
		table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
	});

	await knex.raw(`
    ALTER TABLE doctor_schedule_exceptions
    ADD CONSTRAINT valid_exception_interval
    CHECK (start_at < end_at)
  `);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists("doctor_schedule_exceptions");
}

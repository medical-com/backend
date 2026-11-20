import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("appointment_medical_records", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table
			.uuid("appointment_id")
			.notNullable()
			.unique()
			.references("id")
			.inTable("appointments")
			.onDelete("CASCADE");
		table.text("diagnosis").notNullable();
		table.text("prescription").notNullable().defaultTo("");
		table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
		table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
	});

	await knex.raw(`
		CREATE INDEX appointment_medical_records_appointment_id_idx
		ON appointment_medical_records (appointment_id)
	`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists("appointment_medical_records");
}

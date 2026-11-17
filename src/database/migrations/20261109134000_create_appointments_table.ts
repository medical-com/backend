import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("appointments", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table.uuid("doctor_id").notNullable().references("id").inTable("doctors").onDelete("RESTRICT");
		table.uuid("patient_id").notNullable().references("id").inTable("patients").onDelete("RESTRICT");
		table.uuid("service_id").notNullable().references("id").inTable("services").onDelete("RESTRICT");
		table.timestamp("start_at", { useTz: true }).notNullable();
		table.timestamp("end_at", { useTz: true }).notNullable();
		table
			.enum("status", ["scheduled", "confirmed", "completed", "cancelled", "no_show"], {
				useNative: true,
				enumName: "appointment_status",
				schemaName: "public",
			})
			.notNullable()
			.defaultTo("scheduled");
		table.text("notes").nullable();
		table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
		table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
	});

	await knex.raw(`
		ALTER TABLE appointments
		ADD CONSTRAINT valid_appointment_interval
		CHECK (start_at < end_at)
	`);
	await knex.raw("CREATE INDEX appointments_doctor_time_idx ON appointments (doctor_id, start_at, end_at)");
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists("appointments");
	await knex.raw("DROP TYPE IF EXISTS appointment_status");
}

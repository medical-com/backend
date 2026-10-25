import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("doctor_schedules", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
		table.uuid("doctor_id").notNullable().references("id").inTable("doctors").onDelete("CASCADE");
		table.integer("day_of_week").notNullable(); // ISO: 1 = monday, 7 = sunday
		table.time("start_time").notNullable();
		table.time("end_time").notNullable();
		table.date("valid_from").notNullable();
		table.date("valid_to").nullable();
		table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
		table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
	});

	await knex.raw(`
    ALTER TABLE doctor_schedules
    ADD CONSTRAINT valid_day
    CHECK (day_of_week BETWEEN 1 AND 7)
  `);

	await knex.raw(`
    ALTER TABLE doctor_schedules
    ADD CONSTRAINT valid_hours
    CHECK (start_time < end_time)
  `);

	await knex.raw(`
    ALTER TABLE doctor_schedules
    ADD CONSTRAINT valid_dates
    CHECK (valid_to IS NULL OR valid_to >= valid_from)
  `);

	await knex.raw(`
		CREATE UNIQUE INDEX IF NOT EXISTS doctor_schedules_doctor_day_unique
		ON doctor_schedules (doctor_id, day_of_week)
	`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists("doctor_schedules");
	await knex.raw("DROP INDEX IF EXISTS doctor_schedules_doctor_day_unique");
}

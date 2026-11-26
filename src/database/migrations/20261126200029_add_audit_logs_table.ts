import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("audit_logs", (table) => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

		table.uuid("actor_id").nullable();
		table.enum("actor_type", ["account", "anonymous", "system"]).notNullable();

		table.string("actor_role", 50).nullable();

		table.string("action", 100).notNullable();

		table.enum("outcome", ["success", "failure"]).notNullable();

		table.string("entity_type", 100).nullable();
		table.uuid("entity_id").nullable();

		table.jsonb("changes").nullable();
		table.jsonb("metadata").nullable();

		table.specificType("ip_address", "inet").nullable();
		table.text("user_agent").nullable();
		table.uuid("request_id").nullable();

		table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

		table.index(["created_at"]);
		table.index(["actor_id", "created_at"]);
		table.index(["action", "created_at"]);
		table.index(["entity_type", "entity_id", "created_at"]);
		table.index(["request_id"]);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists("audit_logs");
}

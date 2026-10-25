import type { Knex } from "knex";
import { Account, AccountRole, AccountStatus, Person } from "../types";
import { hashPassword } from "@/core/security/password";

import data from "./data/accounts.json";
import { FileLogger } from "@/core/logger";

const logger = new FileLogger("seeds.log");

export async function seed(knex: Knex): Promise<void> {
	logger.info("Seeding development accounts...");
	if (!data) {
		logger.error("No data found in accounts.json. Skipping seeding.");
		return;
	}

	for (const account of data) {
		const existingAccount = await knex<Account>("public.accounts").where({ email: account.email }).first();
		if (existingAccount) {
			logger.info(`Account with email ${account.email} already exists. Skipping.`);
			continue;
		}

		const [person] = await knex<Person>("public.persons")
			.insert({
				first_name: account.firstName,
				last_name: account.lastName,
				email: account.email,
				pesel: account.pesel,
				date_of_birth: new Date(account.dateOfBirth),
				phone: account.phoneNumber,
			})
			.returning("*");
		if (!person) throw new Error("Insert did not return a row");

		await knex("public.patients").insert({ person_id: person.id });

		const passwordHash = await hashPassword(account.password);
		await knex<Account>("public.accounts").insert({
			email: account.email,
			person_id: person.id,
			email_verified: true,
			password_hash: passwordHash,
			role: AccountRole.PATIENT,
			status: AccountStatus.ACTIVE,
		});
	}

	logger.info("Development accounts seeded successfully.");
}

import type { Knex } from "knex";

import data from "./data/doctors.json";
import { FileLogger } from "@/core/logger";
import { hashPassword } from "@/core/security/password";
import { AccountRole, AccountStatus } from "../types";
import { accountRepository, personRepository } from "../repositories";

const logger = new FileLogger("seeds.log");

export async function seed(knex: Knex): Promise<void> {
	logger.info("Seeding development doctors...");
	if (!data) {
		logger.error("No data found in doctors.json. Skipping seeding.");
		return;
	}

	for (const doctor of data) {
		const existingDoctor = await knex("public.doctors").where({ license_number: doctor.licenseNumber }).first();
		if (existingDoctor) {
			logger.info(`Doctor with license number ${doctor.licenseNumber} already exists. Skipping.`);
			continue;
		}

		const person = await personRepository.insert({
			first_name: doctor.firstName,
			last_name: doctor.lastName,
			email: doctor.email,
			pesel: doctor.pesel,
			date_of_birth: new Date(doctor.dateOfBirth),
			phone: doctor.phoneNumber,
		});
		if (!person) throw new Error("Insert person did not return a row");

		const passwordHash = await hashPassword(doctor.password);
		const account = await accountRepository.insert({
			email: doctor.email,
			person_id: person.id,
			email_verified: true,
			password_hash: passwordHash,
			role: AccountRole.DOCTOR,
			status: AccountStatus.ACTIVE,
		});
		if (!account) throw new Error("Insert account did not return a row");

		await knex("public.doctors").insert({
			person_id: person.id,
			license_number: doctor.licenseNumber,
			specialization: doctor.specialization,
		});
	}

	logger.info("Development doctors seeded successfully.");
}

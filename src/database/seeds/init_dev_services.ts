import type { Knex } from "knex";

import data from "./data/services.json";
import { FileLogger } from "@/core/logger";

const logger = new FileLogger("seeds.log");

type ServiceSeed = (typeof data)[number];

export async function seed(knex: Knex): Promise<void> {
	logger.info("Seeding development services...");

	for (const service of data as ServiceSeed[]) {
		const existingService = await knex("public.services").where({ name: service.name }).first();
		if (existingService) {
			logger.info(`Service ${service.name} already exists. Skipping.`);
			continue;
		}

		const doctors = await knex("public.doctors")
			.select("id", "license_number")
			.whereIn("license_number", service.doctorLicenses);

		const doctorsByLicense = new Map(
			doctors.map((doctor) => [doctor.license_number, doctor.id]),
		);
		const doctorIds = service.doctorLicenses
			.map((licenseNumber) => doctorsByLicense.get(licenseNumber))
			.filter((id): id is string => Boolean(id));

		if (doctorIds.length !== service.doctorLicenses.length) {
			logger.error(`Skipping service ${service.name}: one or more doctors were not found.`);
			continue;
		}

		await knex("public.services").insert({
			name: service.name,
			description: service.description,
			category: service.category,
			duration: service.duration,
			doctor_ids: doctorIds,
		});
	}

	logger.info("Development services seeded successfully.");
}

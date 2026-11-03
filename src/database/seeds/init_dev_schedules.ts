import type { Knex } from "knex";

import data from "./data/schedules.json";
import { FileLogger } from "@/core/logger";

const logger = new FileLogger("seeds.log");

type ScheduleSeed = (typeof data)[number];

export async function seed(knex: Knex): Promise<void> {
	logger.info("Seeding development doctor schedules...");

	for (const schedule of data as ScheduleSeed[]) {
		const doctor = await knex("public.doctors")
			.select("id")
			.where({ license_number: schedule.doctorLicense })
			.first();

		if (!doctor) {
			logger.error(
				`Skipping schedule seed for license ${schedule.doctorLicense}: doctor was not found.`,
			);
			continue;
		}

		for (const dayOfWeek of schedule.days) {
			const existingSchedule = await knex("public.doctor_schedules")
				.where({ doctor_id: doctor.id, day_of_week: dayOfWeek })
				.first();

			if (existingSchedule) {
				logger.info(
					`Schedule for ${schedule.doctorLicense} on day ${dayOfWeek} already exists. Skipping.`,
				);
				continue;
			}

			await knex("public.doctor_schedules").insert({
				doctor_id: doctor.id,
				day_of_week: dayOfWeek,
				start_time: schedule.startTime,
				end_time: schedule.endTime,
				valid_from: "2026-01-01",
				valid_to: null,
			});
		}
	}

	logger.info("Development doctor schedules seeded successfully.");
}

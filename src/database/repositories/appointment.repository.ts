import db from "..";

import { DatabaseError } from "@/core/errors/database-error";
import type { Knex } from "knex";
import type { Appointment } from "../types";

export class AppointmentRepository {
	async listOverlapping(
		data: { doctorId: string; from: Date; to: Date },
		trx?: Knex.Transaction,
	): Promise<Appointment[]> {
		try {
			return await (trx ?? db)<Appointment>("public.appointments")
				.where("doctor_id", data.doctorId)
				.whereNot("status", "cancelled")
				.where("start_at", "<", data.to)
				.where("end_at", ">", data.from)
				.orderBy("start_at", "asc");
		} catch (err) {
			throw new DatabaseError(err);
		}
	}
}

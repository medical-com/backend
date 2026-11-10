import db from "..";

import { DatabaseError } from "@/core/errors/database-error";
import type { Knex } from "knex";
import type { Appointment, AppointmentStatus } from "../types";
import type { ClientAppointment } from "@/types/client/appointment.type";
import type { WithPagination } from "@/types/pagination.type";

export class AppointmentRepository {
	async findDetailedById(data: { id: string }, trx?: Knex.Transaction): Promise<ClientAppointment | undefined> {
		try {
			const row = await this.detailedQuery(trx).where("appointments.id", data.id).first();
			return row ? this.toClientAppointment(row) : undefined;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async listDetailed(
		data: {
			filters?: { doctorId?: string; serviceId?: string; from?: Date; to?: Date; patientName?: string };
			page?: number;
			limit?: number;
		},
		trx?: Knex.Transaction,
	): Promise<WithPagination<ClientAppointment>> {
		const { filters, page = 1, limit = 100 } = data;
		if (!Number.isInteger(page) || page < 1) throw new DatabaseError("Page must be a positive integer");
		if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new DatabaseError("Limit must be between 1 and 100");

		try {
			const query = this.detailedQuery(trx);
			if (filters?.doctorId) query.where("appointments.doctor_id", filters.doctorId);
			if (filters?.serviceId) query.where("appointments.service_id", filters.serviceId);
			if (filters?.from) query.where("appointments.start_at", ">=", filters.from);
			if (filters?.to) query.where("appointments.start_at", "<", filters.to);
			if (filters?.patientName) {
				query.whereRaw("concat_ws(' ', patient_person.first_name, patient_person.last_name) ilike ?", [
					`%${filters.patientName}%`,
				]);
			}

			const [rows, countResult] = await Promise.all([
				query.clone().orderBy("appointments.start_at", "asc").offset((page - 1) * limit).limit(limit),
				query.clone().clearSelect().clearOrder().countDistinct("appointments.id as total"),
			]);
			const total = Number(countResult[0]?.total ?? 0);
			const totalPages = Math.ceil(total / limit);
			return {
				data: rows.map((row) => this.toClientAppointment(row)),
				total,
				page,
				limit,
				totalPages,
				hasNextPage: page < totalPages,
			};
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async insert(
		data: Omit<Appointment, "id" | "created_at" | "updated_at">,
		trx?: Knex.Transaction,
	): Promise<Appointment> {
		try {
			const [appointment] = await (trx ?? db)<Appointment>("public.appointments").insert(data).returning("*");
			if (!appointment) throw new DatabaseError("Failed to insert appointment");
			return appointment;
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	async list(
		data: {
			filters: { doctorId?: string; serviceId?: string; status?: AppointmentStatus; from: Date; to: Date };
			page?: number;
			limit?: number;
		},
		trx?: Knex.Transaction,
	): Promise<WithPagination<Appointment>> {
		const { filters, page = 1, limit = 10 } = data;
		if (page < 1) throw new DatabaseError("Page must be greater than 0");
		if (limit < 1 || limit > 100) throw new DatabaseError("Limit must be between 1 and 100");

		try {
			const query = (trx ?? db)<Appointment>("public.appointments").where((builder) => {
				if (filters.doctorId) builder.where("doctor_id", filters.doctorId);
				if (filters.serviceId) builder.where("service_id", filters.serviceId);
				if (filters.status) builder.where("status", filters.status);
				builder.where("start_at", "<", filters.to).where("end_at", ">", filters.from);
			});

			const [appointments, countResult] = await Promise.all([
				query
					.clone()
					.orderBy("start_at", "asc")
					.offset((page - 1) * limit)
					.limit(limit),
				query.clone().clearSelect().count("id as total"),
			]);
			const total = Number((countResult[0] as { total?: string | number } | undefined)?.total ?? 0);
			const totalPages = Math.ceil(total / limit);

			return {
				data: appointments,
				total,
				page,
				limit,
				totalPages,
				hasNextPage: page < totalPages,
			};
		} catch (err) {
			throw new DatabaseError(err);
		}
	}

	private detailedQuery(trx?: Knex.Transaction) {
			return (trx ?? db)("public.appointments as appointments")
				.join("public.services as services", "services.id", "appointments.service_id")
				.join("public.doctors as doctors", "doctors.id", "appointments.doctor_id")
				.join("public.persons as doctor_person", "doctor_person.id", "doctors.person_id")
				.join("public.patients as patients", "patients.id", "appointments.patient_id")
				.join("public.persons as patient_person", "patient_person.id", "patients.person_id")
				.select(
					"appointments.id",
					"appointments.start_at",
					"appointments.end_at",
					"appointments.status",
					"appointments.notes",
					"services.id as service_id",
					"services.name as service_name",
					"services.duration as service_duration",
					"doctors.id as doctor_id",
					"doctors.specialization as doctor_specialization",
					"doctor_person.first_name as doctor_first_name",
					"doctor_person.last_name as doctor_last_name",
					"patients.id as patient_id",
					"patient_person.first_name as patient_first_name",
					"patient_person.last_name as patient_last_name",
					"patient_person.pesel as patient_pesel",
					"patient_person.email as patient_email",
					"patient_person.phone as patient_phone",
					"patient_person.date_of_birth as patient_date_of_birth",
				);
		}

	private toClientAppointment(row: any): ClientAppointment {
			return {
				id: row.id,
				startAt: new Date(row.start_at).toISOString(),
				endAt: new Date(row.end_at).toISOString(),
				status: row.status,
				notes: row.notes,
				service: { id: row.service_id, name: row.service_name, duration: row.service_duration },
				doctor: {
					id: row.doctor_id,
					firstName: row.doctor_first_name,
					lastName: row.doctor_last_name,
					specialization: row.doctor_specialization,
				},
				patient: {
					id: row.patient_id,
					firstName: row.patient_first_name,
					lastName: row.patient_last_name,
					pesel: row.patient_pesel,
					email: row.patient_email,
					phone: row.patient_phone,
					dateOfBirth: new Date(row.patient_date_of_birth).toISOString(),
				},
			};
	}
}

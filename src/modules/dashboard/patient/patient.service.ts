import { AppError } from "@/core/errors/app-error";
import { patientRepository } from "@/database/repositories";
import { Patient } from "@/database/types/patients.types";
import { Person } from "@/database/types/persons.types";
import { ClientPatient } from "@/types/client/patient.type";
import { WithPagination } from "@/types/pagination.type";

class DashboardPatientService {
	async findOne(id: string): Promise<ClientPatient> {
		const patient = await patientRepository.findWithPerson({ id });
		if (!patient) throw new AppError("Patient not found", 404);

		return this.toClientPatient(patient);
	}

	async list(data: {
		filters: { name?: string; email?: string; phoneNumber?: string };
		page?: number;
		limit?: number;
	}): Promise<WithPagination<ClientPatient>> {
		const { filters, page = 1, limit = 10 } = data;
		const patients = await patientRepository.list({
			filters: { name: filters.name, email: filters.email, phoneNumber: filters.phoneNumber },
			page,
			limit,
		});

		return {
			data: patients ? patients.data.map((patient) => this.toClientPatient(patient)) : [],
			hasNextPage: patients.hasNextPage,
			limit: patients.limit,
			page: patients.page,
			total: patients.total,
			totalPages: patients.totalPages,
		};
	}

	private toClientPatient(patient: Patient & { person: Person }): ClientPatient {
		return {
			id: patient.id,
			firstName: patient.person.first_name,
			lastName: patient.person.last_name,
			pesel: patient.person.pesel,
			email: patient.person.email,
			phone: patient.person.phone,
			dateOfBirth: new Date(patient.person.date_of_birth),
		};
	}
}
export const dashboardPatientService = new DashboardPatientService();

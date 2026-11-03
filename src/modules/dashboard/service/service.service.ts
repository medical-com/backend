import { AppError } from "@/core/errors/app-error";
import { serviceRepository } from "@/database/repositories";
import type { Service, ServiceCategory } from "@/database/types";
import type { ClientService } from "@/types/client/service.type";
import type { WithPagination } from "@/types/pagination.type";

class DashboardServiceService {
	async findOne(id: string): Promise<ClientService> {
		const service = await serviceRepository.findById({ id });
		if (!service) throw new AppError("Service not found", 404);
		return this.toClientService(service);
	}

	async list(data: {
		filters: { name?: string; category?: ServiceCategory };
		page?: number;
		limit?: number;
	}): Promise<WithPagination<ClientService>> {
		const result = await serviceRepository.list(data);
		return {
			data: result.data.map((service) => this.toClientService(service)),
			total: result.total,
			page: result.page,
			limit: result.limit,
			totalPages: result.totalPages,
			hasNextPage: result.hasNextPage,
		};
	}

	async create(data: {
		name: string;
		description: string;
		category: ServiceCategory;
		duration: number;
		doctorIds: string[];
	}): Promise<ClientService> {
		const service = await serviceRepository.insert({
			name: data.name,
			description: data.description,
			category: data.category,
			duration: data.duration,
			doctor_ids: data.doctorIds,
		});

		return this.toClientService(service);
	}

	async update(data: {
		id: string;
		update: {
			name?: string;
			description?: string;
			category?: ServiceCategory;
			duration?: number;
			doctorIds?: string[];
		};
	}): Promise<ClientService> {
		const existing = await serviceRepository.findById({ id: data.id });
		if (!existing) throw new AppError("Service not found", 404);
		const { doctorIds, ...update } = data.update;
		const service = await serviceRepository.update({
			id: data.id,
			update: { ...update, ...(doctorIds ? { doctor_ids: doctorIds } : {}) },
		});

		return this.toClientService(service);
	}

	async delete(id: string): Promise<boolean> {
		const existing = await serviceRepository.findById({ id });
		if (!existing) throw new AppError("Service not found", 404);

		const deleted = await serviceRepository.delete({ id });
		if (!deleted) throw new AppError("Service not found", 404);

		return true;
	}

	private toClientService(service: Service): ClientService {
		return {
			id: service.id,
			name: service.name,
			description: service.description,
			category: service.category,
			duration: service.duration,
			doctorIds: service.doctor_ids,
			createdAt: service.created_at,
			updatedAt: service.updated_at,
		};
	}
}

export const dashboardServiceService = new DashboardServiceService();

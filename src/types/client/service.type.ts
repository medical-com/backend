import type { ServiceCategory } from "@/database/types";

export interface ClientService {
	id: string;
	name: string;
	description: string;
	category: ServiceCategory;
	duration: number;
	doctorIds: string[];
	createdAt: Date;
	updatedAt: Date;
}

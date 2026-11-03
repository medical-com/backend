export enum ServiceCategory {
	GENERAL = "general",
	SPECIALIST = "specialist",
	SURGERY = "surgery",
	DENTAL = "dental",
	VISION = "vision",
	MENTAL_HEALTH = "mental_health",
	PHYSICAL_THERAPY = "physical_therapy",
}

export interface Service {
	id: string;
	name: string;
	description: string;
	category: ServiceCategory;
	duration: number; // Duration in minutes
	doctor_ids: string[];
	created_at: Date;
	updated_at: Date;
}

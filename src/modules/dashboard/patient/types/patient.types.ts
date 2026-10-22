import type { Flatten } from "@/types/api-paths.type";

export const paths = {
	findOne: "/dashboard/patient/find-one",
	list: "/dashboard/patient/list",
	update: "/dashboard/patient/update",
} as const;
export type DashboardPatientPaths = Flatten<typeof paths>;

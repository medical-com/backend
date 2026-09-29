import type { Flatten } from "@/types/api-paths.type";

export const paths = {
	list: "/dashboard/patient/list",
} as const;
export type DashboardPatientPaths = Flatten<typeof paths>;

import type { Flatten } from "@/types/api-paths.type";

export const paths = {
	findOne: "/dashboard/doctor/find-one",
	list: "/dashboard/doctor/list",
	update: "/dashboard/doctor/update",
} as const;
export type DashboardDoctorPaths = Flatten<typeof paths>;

import type { Flatten } from "@/types/api-paths.type";

export const paths = {
	findOne: "/dashboard/doctor/find-one",
	list: "/dashboard/doctor/list",
} as const;
export type DashboardDoctorPaths = Flatten<typeof paths>;

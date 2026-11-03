import type { Flatten } from "@/types/api-paths.type";

export const paths = {
	findOne: "/dashboard/service/find-one",
	list: "/dashboard/service/list",
	create: "/dashboard/service/create",
	update: "/dashboard/service/update",
	delete: "/dashboard/service/delete",
} as const;
export type DashboardServicePaths = Flatten<typeof paths>;

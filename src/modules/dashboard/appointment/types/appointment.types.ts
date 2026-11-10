import type { Flatten } from "@/types/api-paths.type";

export const paths = {
	listAvailableDates: "/dashboard/appointment/available-dates",
	create: "/dashboard/appointment",
	list: "/dashboard/appointment/list",
	findOne: "/dashboard/appointment/find-one",
} as const;
export type DashboardAppointmentPaths = Flatten<typeof paths>;

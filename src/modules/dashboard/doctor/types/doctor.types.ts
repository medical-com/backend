import type { Flatten } from "@/types/api-paths.type";

export const paths = {
	findOne: "/dashboard/doctor/find-one",
	list: "/dashboard/doctor/list",
	update: "/dashboard/doctor/update",
	create: "/dashboard/doctor/create",
	confirmInvitation: "/dashboard/doctor/confirm-invitation",
	createSchedule: "/dashboard/doctor/schedule/create",
	updateSchedule: "/dashboard/doctor/schedule/update",
	listSchedules: "/dashboard/doctor/schedule/list",
} as const;
export type DashboardDoctorPaths = Flatten<typeof paths>;

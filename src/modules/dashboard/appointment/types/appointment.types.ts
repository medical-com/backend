import type { Flatten } from "@/types/api-paths.type";

export const paths = {
	listAvailableDates: "/dashboard/appointment/available-dates",
	create: "/dashboard/appointment",
	list: "/dashboard/appointment/list",
	findOne: "/dashboard/appointment/find-one",
	updateStatus: "/dashboard/appointment/update-status",
	createMedicalRecord: "/dashboard/appointment/medical-record/create",
	updateMedicalRecord: "/dashboard/appointment/medical-record/update",
	findOneMedicalRecord: "/dashboard/appointment/medical-record/find-one",
	listMedicalRecords: "/dashboard/appointment/medical-record/list",
} as const;
export type DashboardAppointmentPaths = Flatten<typeof paths>;

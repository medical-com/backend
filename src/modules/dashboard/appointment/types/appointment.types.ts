import type { Flatten } from "@/types/api-paths.type";

export const paths = {
	listAvailableDates: "/dashboard/appointment/available-dates",
} as const;
export type DashboardAppointmentPaths = Flatten<typeof paths>;

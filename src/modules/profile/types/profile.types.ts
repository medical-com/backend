import { Flatten } from "@/types/api-paths.type";

export const paths = {
	listAppointments: "/profile/appointments",
	findOneAppointment: "/profile/appointments/find-one",
	cancelAppointment: "/profile/appointments/cancel",
} as const;
export type ProfilePaths = Flatten<typeof paths>;

import { calendarDateSchema } from "@/types/zod.types";
import { z } from "zod";

export const ListAvailableDatesSchema = z
	.strictObject({
		doctorId: z.uuid(),
		serviceId: z.uuid(),
		from: calendarDateSchema.optional(),
		to: calendarDateSchema.optional(),
	})
	.refine((data) => !data.from || !data.to || data.from <= data.to, {
		message: "The end date must not be before the start date",
		path: ["to"],
	});
export type ListAvailableDatesQuery = z.infer<typeof ListAvailableDatesSchema>;

export type AvailableDate = {
	date: string;
	slots: string[];
};
export type ListAvailableDatesResponse = {
	data: AvailableDate[];
};

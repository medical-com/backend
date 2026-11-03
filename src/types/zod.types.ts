import { z } from "zod";

const isNotFuture = (value: Date) => value <= new Date();

export const nameSchema = z
	.string()
	.trim()
	.min(1)
	.max(100)
	.regex(/^[\p{L}\s'-]+$/u, "Name contains invalid characters");
export const emailSchema = z.email().max(255);
export const peselSchema = z.string().trim().length(11).regex(/^\d+$/);
export const dateOnlyStringSchema = z.iso.date().refine((value) => value <= new Date().toISOString().slice(0, 10), {
	message: "Date of birth cannot be in the future",
});
export const calendarDateSchema = z.iso.date().pipe(z.coerce.date());
export const dateSchema = dateOnlyStringSchema.pipe(z.coerce.date()).refine(isNotFuture, {
	message: "Date cannot be in the future",
});
export const dateTimeSchema = z.iso.datetime({ local: true, offset: true }).pipe(z.coerce.date());

export const phoneNumberSchema = z
	.string()
	.transform((value) => value.replace(/\s/g, ""))
	.pipe(z.e164({ error: "Invalid phone number format" }));

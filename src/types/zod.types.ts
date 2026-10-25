import { z } from "zod";

export const phoneNumberSchema = z
	.string()
	.transform((value) => value.replace(/\s/g, ""))
	.pipe(z.e164({ error: "Invalid phone number format" }));

import type { z } from "zod";
import { AppError } from "@/core/errors/app-error";

/**
 * Validates and transforms input data using a Zod schema.
 *
 * @param schema - Zod schema used to validate the input.
 * @param data - Data to validate.
 * @returns The validated and transformed data with its inferred TypeScript type.
 * @throws {AppError} When the input data does not match the schema.
 */
export function validate<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
	const result = schema.safeParse(data);
	if (!result.success) throw new AppError(result.error.issues.map((issue) => issue.message).join(", "), 400);

	return result.data;
}

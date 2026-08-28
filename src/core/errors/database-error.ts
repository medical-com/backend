import { AppError } from "@/core/errors/app-error";

// Postgres SQLSTATE codes treated as expected/operational failures.
// Full list: https://www.postgresql.org/docs/current/errcodes-appendix.html
const KNOWN_PG_ERROR_CODES: Record<string, { statusCode: number; message: string }> = {
	"23502": { statusCode: 400, message: "Missing required field" },
	"23503": { statusCode: 409, message: "Related resource does not exist" },
	"23505": { statusCode: 409, message: "Resource already exists" },
	"23514": { statusCode: 400, message: "Invalid value" },
};

function getPgErrorCode(error: unknown): string | undefined {
	if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string")
		return error.code;

	return undefined;
}

export class DatabaseError extends AppError {
	constructor(cause: unknown) {
		const known = KNOWN_PG_ERROR_CODES[getPgErrorCode(cause) ?? ""];

		// Unknown DB failures (connection loss, syntax errors, etc.) stay non-operational
		// so the error handler masks the message and logs the original for debugging.
		super(known?.message ?? "Database error", known?.statusCode ?? 500, known !== undefined);

		this.name = "DatabaseError";
		this.cause = cause;
	}
}

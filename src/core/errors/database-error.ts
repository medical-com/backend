import { AppError } from "@/core/errors/app-error";

const KNOWN_PG_ERROR_CODES: Record<string, { statusCode: number; message: string }> = {
	"23502": { statusCode: 400, message: "Missing required field" },
	"23503": { statusCode: 409, message: "Related resource does not exist" },
	"23505": { statusCode: 409, message: "Resource already exists" },
	"23514": { statusCode: 400, message: "Invalid value" },
};

interface PgError {
	code?: string;
	detail?: string;
	constraint?: string;
	table?: string;
	column?: string;
}

export class DatabaseError extends AppError {
	constructor(cause: unknown) {
		const pgError = cause as PgError;
		const known = KNOWN_PG_ERROR_CODES[pgError?.code ?? ""];

		const message = pgError?.code === "23505" ? (pgError.detail ?? known?.message) : known?.message;

		super(message ?? "Database error", known?.statusCode ?? 500, known !== undefined);

		this.name = "DatabaseError";
		this.cause = cause;
	}
}

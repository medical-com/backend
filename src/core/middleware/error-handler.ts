import type { ErrorRequestHandler } from "express";
import { config } from "@/core/config";
import { AppError } from "@/core/errors/app-error";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
	const isAppError = error instanceof AppError;
	const statusCode = isAppError ? error.statusCode : 500;
	const message = isAppError && error.isOperational ? error.message : "Internal server error";

	if (!isAppError || !error.isOperational) console.error(error);

	res.status(statusCode).json({
		error: {
			message,
			...(config.env === "development" && {
				stack: error instanceof Error ? error.stack : undefined,
			}),
		},
	});
};

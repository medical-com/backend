import { DatabaseError } from "@/core/errors/database-error";
import type { WithPagination } from "@/types/pagination.type";

export interface PaginationParams {
	page: number;
	limit: number;
	offset: number;
}

export function getPaginationParams(
	data: { page?: number; limit?: number },
	defaultLimit = 10,
	maxLimit = 100,
): PaginationParams {
	const page = data.page ?? 1;
	const limit = data.limit ?? defaultLimit;

	if (!Number.isInteger(page) || page < 1) throw new DatabaseError("Page must be a positive integer");
	if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit)
		throw new DatabaseError(`Limit must be between 1 and ${maxLimit}`);

	return {
		page,
		limit,
		offset: (page - 1) * limit,
	};
}

export function withPagination<T>(data: T[], total: number, pagination: PaginationParams): WithPagination<T> {
	const totalPages = Math.ceil(total / pagination.limit);

	return {
		data,
		total,
		page: pagination.page,
		limit: pagination.limit,
		totalPages,
		hasNextPage: pagination.page < totalPages,
	};
}

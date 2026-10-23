export interface WithPagination<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	hasNextPage: boolean;
}

export interface WithPaginationResponse<T> {
	data: T[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
		hasNextPage: boolean;
	};
}

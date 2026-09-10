/** Build a paginated response object */
export function paginate(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

/** Parse pagination query params with defaults */
export function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/** Standard success response */
export function successResponse<T>(data: T, message = 'Success') {
  return { success: true, message, data };
}

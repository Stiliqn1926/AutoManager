// Pagination helper
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Environment constants
const DEFAULT_LIMIT = parseInt(process.env.DEFAULT_PAGINATION_LIMIT || '20');
const MAX_LIMIT = parseInt(process.env.MAX_PAGINATION_LIMIT || '100');

export const getPagination = (
  page: number = 1,
  limit: number = DEFAULT_LIMIT
): PaginationResult => {

  const validPage = Math.max(1, Math.floor(page));
  const validLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)));

  const skip = (validPage - 1) * validLimit;

  return {
    skip,
    take: validLimit,
    page: validPage,
    limit: validLimit,
  };
};

export const getPaginationMeta = (
  totalItems: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};


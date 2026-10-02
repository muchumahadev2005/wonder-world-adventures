/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Pagination Utility
 *
 * Parses, validates, and clamps pagination parameters.
 * Returns standardized pagination metadata for API responses.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const MIN_PAGE  = 1;
const MIN_LIMIT = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse and clamp pagination params from a query object.
 *
 * @param {object} query — req.query
 * @param {object} [defaults] — override defaults
 * @returns {{ page: number, limit: number, skip: number }}
 */
const parsePagination = (query = {}, defaults = {}) => {
	const page  = Math.max(MIN_PAGE,  parseInt(query.page)  || defaults.page  || MIN_PAGE);
	const limit = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, parseInt(query.limit) || defaults.limit || DEFAULT_LIMIT));
	const skip  = (page - 1) * limit;
	return { page, limit, skip };
};

/**
 * Build pagination metadata for API response.
 *
 * @param {number} total — total number of records
 * @param {number} page — current page
 * @param {number} limit — items per page
 * @returns {object} — pagination metadata
 */
const buildPaginationMeta = (total, page, limit) => {
	const totalPages = Math.ceil(total / limit) || 1;
	return {
		page,
		limit,
		total,
		totalPages,
		hasNextPage: page < totalPages,
		hasPreviousPage: page > 1,
	};
};

/**
 * Allowed sort fields whitelist — prevents SQL injection via sort params.
 *
 * @param {string} sortBy — requested sort field
 * @param {string[]} allowed — whitelist of allowed field names
 * @param {string} [fallback="createdAt"] — default sort field
 * @returns {string}
 */
const safeSortField = (sortBy, allowed, fallback = "createdAt") => {
	return allowed.includes(sortBy) ? sortBy : fallback;
};

/**
 * Validate sort direction.
 * @param {string} dir
 * @returns {"asc"|"desc"}
 */
const safeSortDir = (dir) => {
	return dir === "asc" ? "asc" : "desc";
};

module.exports = {
	parsePagination,
	buildPaginationMeta,
	safeSortField,
	safeSortDir,
	MIN_PAGE,
	MIN_LIMIT,
	DEFAULT_LIMIT,
	MAX_LIMIT,
};

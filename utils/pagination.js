/**
 * Pagination Utilities
 * Provides cursor-based pagination for messages and other collections
 */

/**
 * Parse cursor pagination parameters
 * @param {Object} query - Request query object
 * @returns {Object} - Parsed pagination parameters
 */
export const parseCursorPagination = (query) => {
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));
  const before = query.before || null; // Message ID to fetch messages before
  const after = query.after || null;   // Message ID to fetch messages after
  
  return {
    limit,
    before,
    after,
  };
};

/**
 * Build pagination metadata for cursor-based pagination
 * @param {Array} items - Array of items returned
 * @param {Number} limit - Requested limit
 * @param {String} cursorField - Field name used for cursor (default: '_id')
 * @returns {Object} - Pagination metadata
 */
export const buildCursorPaginationMeta = (items, limit, cursorField = '_id') => {
  const hasMore = items.length === limit;
  
  let nextCursor = null;
  let prevCursor = null;

  if (items.length > 0) {
    // Next cursor is the ID of the last item
    nextCursor = items[items.length - 1][cursorField]?.toString() || items[items.length - 1]._id.toString();
    
    // Previous cursor is the ID of the first item
    prevCursor = items[0][cursorField]?.toString() || items[0]._id.toString();
  }

  return {
    hasMore,
    nextCursor: hasMore ? nextCursor : null,
    prevCursor,
    count: items.length,
    limit,
  };
};

/**
 * Build offset-based pagination metadata
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} totalCount - Total number of items
 * @returns {Object} - Pagination metadata
 */
export const buildOffsetPaginationMeta = (page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalCount,
    limit,
    hasNextPage,
    hasPrevPage,
  };
};

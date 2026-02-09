// Response Utilities - Standardized API responses

/**
 * Send a success response.
 * @param {Response} res - Express response object
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send a created response (201).
 * @param {Response} res - Express response object
 * @param {any} data - Created resource data
 */
function created(res, data) {
  return res.status(201).json({
    success: true,
    data,
  });
}

/**
 * Send an error response.
 * @param {Response} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 */
function error(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

/**
 * Send a no content response (204).
 * @param {Response} res - Express response object
 */
function noContent(res) {
  return res.status(204).end();
}

/**
 * HTTP status helpers for common scenarios
 */
const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

module.exports = {
  success,
  created,
  error,
  noContent,
  HttpStatus,
};

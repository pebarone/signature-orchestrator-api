// Validation Utilities

/**
 * Validate email format.
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  return typeof email === "string" && email.includes("@");
}

/**
 * Parse and validate emails from request body.
 * Handles comma/semicolon separated values.
 * @param {string} email1 - First email field
 * @param {string} email2 - Second email field (optional)
 * @returns {string[]} Array of valid emails
 */
function parseEmails(email1, email2) {
  return [email1, email2]
    .filter(Boolean)
    .flatMap((e) => e.split(/[;,]+/))
    .map((e) => e.trim())
    .filter((e) => isValidEmail(e));
}

/**
 * Check if a value is a valid positive number.
 * @param {any} value - Value to check
 * @returns {boolean} True if valid positive number
 */
function isValidId(value) {
  return value && !isNaN(+value) && +value > 0;
}

module.exports = {
  isValidEmail,
  parseEmails,
  isValidId,
};

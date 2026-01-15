/**
 * Extract error message from various API error response formats
 * Handles FastAPI/Pydantic validation error format and standard error responses
 * 
 * @param {Error} error - The error object from axios catch block
 * @param {string} fallback - Default message if error cannot be parsed
 * @returns {string} - Human-readable error message
 */
export const getErrorMessage = (error, fallback = 'An error occurred') => {
  const detail = error?.response?.data?.detail;
  
  if (!detail) return fallback;
  
  // If detail is a string, return it directly
  if (typeof detail === 'string') return detail;
  
  // If detail is an array (Pydantic validation errors)
  if (Array.isArray(detail) && detail.length > 0) {
    const firstError = detail[0];
    // Pydantic validation error format: {type, loc, msg, input, url}
    if (firstError.msg) return firstError.msg;
    // Fallback: stringify the first error
    return JSON.stringify(firstError);
  }
  
  // If detail is an object with a msg property
  if (typeof detail === 'object' && detail.msg) return detail.msg;
  
  // If detail is an object with a message property
  if (typeof detail === 'object' && detail.message) return detail.message;
  
  return fallback;
};

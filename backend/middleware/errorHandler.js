/**
 * TriMedi Unified Production Error Handler Middleware
 * Formats errors consistently, sanitizes internal details in production,
 * and eliminates stack trace exposure.
 */

export const errorHandler = (err, req, res, next) => {
  const isProduction =
    process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";

  const statusCode = err.status || err.statusCode || (err.message.includes("not found") ? 404 : 500);

  const errorCode =
    err.code ||
    (statusCode === 400
      ? "BAD_REQUEST"
      : statusCode === 401
      ? "UNAUTHORIZED"
      : statusCode === 403
      ? "FORBIDDEN"
      : statusCode === 404
      ? "NOT_FOUND"
      : statusCode === 409
      ? "CONFLICT"
      : statusCode === 422
      ? "UNPROCESSABLE_ENTITY"
      : statusCode === 429
      ? "RATE_LIMIT_EXCEEDED"
      : statusCode === 503
      ? "SERVICE_UNAVAILABLE"
      : "INTERNAL_SERVER_ERROR");

  // In production, mask raw database or internal runtime messages
  let publicMessage = err.message;
  if (isProduction && statusCode === 500) {
    publicMessage = "An unexpected error occurred while processing your request. Please try again later.";
  }

  const responsePayload = {
    success: false,
    error: {
      code: errorCode,
      message: publicMessage,
    },
  };

  // Attach stack trace only in development
  if (!isProduction && err.stack) {
    responsePayload.error.stack = err.stack;
  }

  // Also include top-level message for backward-compatibility with older frontend consumers
  responsePayload.message = publicMessage;

  console.error(`[API Error ${statusCode}] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json(responsePayload);
};

export default errorHandler;

const successResponse = (
  res,
  message = "Request successful",
  data = {},
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Error Response
 */
const errorResponse = (
  res,
  message = "Something went wrong",
  errors = null,
  statusCode = 500
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

/**
 * Async Controller Wrapper
 */
const apiErrorHandler = (controller) => {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      console.error("API Error:", error);

      return errorResponse(
        res,
        error.message || "Internal Server Error",
        process.env.NODE_ENV === "development" ? error.stack : null,
        error.statusCode || 500
      );
    }
  };
};

module.exports = {
  successResponse,
  errorResponse,
  apiErrorHandler,
};
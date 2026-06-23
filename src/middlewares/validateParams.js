/**
 * Validates req.params with a Joi schema.
 */
const validateParams = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.params, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(422).json({
      success: false,
      message: "Invalid url parameter",
      errors,
    });
  }

  next();
};

export default validateParams;

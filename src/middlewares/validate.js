/**
 * Validates req.body with a Joi schema.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  req.body = value;
  next();
};

export default validate;

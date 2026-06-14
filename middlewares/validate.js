/**
 * Generic Joi validation middleware factory.
 * Usage: router.post("/signup", validate(signupSchema), signupController)
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((d) => d.message);
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

export default validate;
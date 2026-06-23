import Joi from "joi";

export const signupSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).trim().required().messages({
    "string.min": "First name must be at least 2 characters",
    "string.max": "First name must not exceed 50 characters",
    "any.required": "First name is required",
  }),
  last_name: Joi.string().min(2).max(50).trim().required().messages({
    "string.min": "Last name must be at least 2 characters",
    "string.max": "Last name must not exceed 50 characters",
    "any.required": "Last name is required",
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-().]{7,20}$/)
    .required()
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
      "any.required": "Phone number is required",
    }),
  address: Joi.string().min(5).max(200).trim().required().messages({
    "string.min": "Address must be at least 5 characters",
    "any.required": "Address is required",
  }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)",
      "any.required": "Password is required",
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Reset token is required",
  }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)",
      "any.required": "Password is required",
    }),
});
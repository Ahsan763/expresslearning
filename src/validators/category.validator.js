import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required().messages({
    "any.required": "Category name is required",
  }),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().optional(),
}).min(1);

export const mongoIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid id format",
  }),
});

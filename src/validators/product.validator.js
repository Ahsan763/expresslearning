import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(150).trim().required(),
  description: Joi.string().min(10).max(2000).trim().required(),
  price: Joi.number().positive().required(),
  stock: Joi.number().integer().min(0).required(),
  category: Joi.string().hex().length(24).required().messages({
    "string.length": "Please provide a valid category id",
  }),
  isActive: Joi.boolean().truthy("true").falsy("false").optional(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(150).trim().optional(),
  description: Joi.string().min(10).max(2000).trim().optional(),
  price: Joi.number().positive().optional(),
  stock: Joi.number().integer().min(0).optional(),
  category: Joi.string().hex().length(24).optional(),
  isActive: Joi.boolean().truthy("true").falsy("false").optional(),
}).min(1);

export const mongoIdParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.length": "Invalid id format",
  }),
});

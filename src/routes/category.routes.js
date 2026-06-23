import express from "express";
import { requireSignIn, isAdmin } from "../middlewares/auth.middlewares.js";
import validate from "../middlewares/validate.js";
import validateParams from "../middlewares/validateParams.js";
import {
  createCategorySchema,
  updateCategorySchema,
  mongoIdParamSchema,
} from "../validators/category.validator.js";
import {
  createCategoryController,
  getCategoriesController,
  getCategoryController,
  updateCategoryController,
  deleteCategoryController,
} from "../controllers/category.controller.js";

const router = express.Router();

router.use(requireSignIn, isAdmin);

router.post("/", validate(createCategorySchema), createCategoryController);

router.get("/", getCategoriesController);

router.get(
  "/:id",
  validateParams(mongoIdParamSchema),
  getCategoryController
);

router.put(
  "/:id",
  validateParams(mongoIdParamSchema),
  validate(updateCategorySchema),
  updateCategoryController
);

router.delete(
  "/:id",
  validateParams(mongoIdParamSchema),
  deleteCategoryController
);

export default router;

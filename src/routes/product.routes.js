import express from "express";
import { requireSignIn, isAdmin } from "../middlewares/auth.middlewares.js";
import validate from "../middlewares/validate.js";
import validateParams from "../middlewares/validateParams.js";
import {
  uploadProductImages,
  handleMulterError,
} from "../config/multer.config.js";
import {
  createProductSchema,
  updateProductSchema,
  mongoIdParamSchema,
} from "../validators/product.validator.js";
import {
  createProductController,
  getProductsController,
  getProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller.js";

const router = express.Router();

router.use(requireSignIn, isAdmin);

router.post(
  "/",
  uploadProductImages,
  handleMulterError,
  validate(createProductSchema),
  createProductController
);

router.get("/", getProductsController);

router.get(
  "/:id",
  validateParams(mongoIdParamSchema),
  getProductController
);

router.put(
  "/:id",
  validateParams(mongoIdParamSchema),
  uploadProductImages,
  handleMulterError,
  validate(updateProductSchema),
  updateProductController
);

router.delete(
  "/:id",
  validateParams(mongoIdParamSchema),
  deleteProductController
);

export default router;

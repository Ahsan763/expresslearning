import * as categoryService from "../services/category.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const createCategoryController = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(
    req.body,
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: "Category created successfully.",
    data: category,
  });
});

export const getCategoriesController = asyncHandler(async (_req, res) => {
  const categories = await categoryService.getAllCategories();

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

export const getCategoryController = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  res.status(200).json({
    success: true,
    data: category,
  });
});

export const updateCategoryController = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(
    req.params.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Category updated successfully.",
    data: category,
  });
});

export const deleteCategoryController = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);

  res.status(200).json({
    success: true,
    ...result,
  });
});

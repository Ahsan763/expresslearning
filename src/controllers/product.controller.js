import * as productService from "../services/product.service.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const createProductController = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(
    req.body,
    req.files,
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully.",
    data: product,
  });
});

export const getProductsController = asyncHandler(async (_req, res) => {
  const products = await productService.getAllProducts();

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

export const getProductController = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  res.status(200).json({
    success: true,
    data: product,
  });
});

export const updateProductController = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(
    req.params.id,
    req.body,
    req.files
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    data: product,
  });
});

export const deleteProductController = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);

  res.status(200).json({
    success: true,
    ...result,
  });
});

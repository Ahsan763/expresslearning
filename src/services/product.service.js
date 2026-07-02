import Product from "../modules/product.model.js";
import Category from "../modules/category.model.js";
import { AppError } from "../utils/app.error.js";
import { createSlug, uniqueSlug } from "../utils/slug.js";
import { buildUploadPath, deleteFiles } from "../utils/file.helper.js";

const parseBoolean = (value, defaultValue = true) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;
  return value === "true";
};

const parseNumber = (value) => Number(value);

const ensureCategoryExists = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new AppError("Selected category does not exist.", 404);
  }
  return category;
};

export const createProduct = async (data, files, adminId) => {
  const { name, description, price, stock, category } = data;

  if (!files || files.length === 0) {
    throw new AppError("At least one product image is required.", 400);
  }

  await ensureCategoryExists(category);

  const baseSlug = createSlug(name);
  const slug = await uniqueSlug(Product, baseSlug);

  const images = (files || []).map((file) =>
    buildUploadPath("products", file.filename)
  );

  const product = await Product.create({
    name,
    slug,
    description,
    price: parseNumber(price),
    stock: parseNumber(stock),
    category,
    images,
    isActive: parseBoolean(data.isActive),
    createdBy: adminId,
  });

  return product.populate("category", "name slug");
};

export const getAllProducts = async () => {
  return Product.find()
    .populate("category", "name slug")
    .sort({ createdAt: -1 });
};

export const getProductById = async (id) => {
  const product = await Product.findById(id).populate("category", "name slug");
  if (!product) {
    throw new AppError("Product not found.", 404);
  }
  return product;
};

export const updateProduct = async (id, data, files) => {
  const product = await getProductById(id);

  if (data.name) {
    product.name = data.name;
    const baseSlug = createSlug(data.name);
    product.slug = await uniqueSlug(Product, baseSlug, id);
  }

  if (data.description !== undefined) {
    product.description = data.description;
  }

  if (data.price !== undefined) {
    product.price = parseNumber(data.price);
  }

  if (data.stock !== undefined) {
    product.stock = parseNumber(data.stock);
  }

  if (data.category) {
    await ensureCategoryExists(data.category);
    product.category = data.category;
  }

  if (data.isActive !== undefined) {
    product.isActive = parseBoolean(data.isActive);
  }

  if (files && files.length > 0) {
    await deleteFiles(product.images);
    product.images = files.map((file) => buildUploadPath("products", file.filename));
  }

  await product.save();
  return product.populate("category", "name slug");
};

export const deleteProduct = async (id) => {
  const product = await getProductById(id);

  await deleteFiles(product.images);
  await product.deleteOne();

  return { message: "Product deleted successfully." };
};

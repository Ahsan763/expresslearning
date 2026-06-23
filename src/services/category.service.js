import Category from "../modules/category.module.js";
import Product from "../modules/product.module.js";
import { AppError } from "../utils/app.error.js";
import { createSlug, uniqueSlug } from "../utils/slug.js";

export const createCategory = async (data, adminId) => {
  const { name } = data;

  const baseSlug = createSlug(name);
  const slug = await uniqueSlug(Category, baseSlug);

  const category = await Category.create({
    name,
    slug,
    createdBy: adminId,
  });

  return category;
};

export const getAllCategories = async () => {
  return Category.find().sort({ createdAt: -1 });
};

export const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError("Category not found.", 404);
  }
  return category;
};

export const updateCategory = async (id, data) => {
  const category = await getCategoryById(id);

  if (data.name) {
    category.name = data.name;
    const baseSlug = createSlug(data.name);
    category.slug = await uniqueSlug(Category, baseSlug, id);
  }

  await category.save();
  return category;
};

export const deleteCategory = async (id) => {
  const category = await getCategoryById(id);

  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw new AppError(
      "Cannot delete category while products are still linked to it.",
      400
    );
  }

  await category.deleteOne();

  return { message: "Category deleted successfully." };
};

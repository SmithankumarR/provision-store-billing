import Category, { ICategory } from '../models/Category';
import Item from '../models/Item';
import { ApiError } from '../middlewares/errorHandler';

export interface CategoryQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
}

export const createCategory = async (
  storeId: string,
  data: { name: string; description?: string; imageUrl?: string }
): Promise<ICategory> => {
  // Check if a category with the same name already exists in this store
  const existingCategory = await Category.findOne({
    storeId,
    name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
  });

  if (existingCategory) {
    throw new ApiError('A category with this name already exists in your store.', 400);
  }

  const category = new Category({
    name: data.name.trim(),
    description: data.description || '',
    imageUrl: data.imageUrl || '',
    storeId,
    isActive: true,
  });

  return await category.save();
};

export const getCategories = async (
  storeId: string,
  filters: CategoryQueryFilters
) => {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  const skip = (page - 1) * limit;

  const query: any = { storeId };

  // Status filtering
  if (filters.status === 'active') {
    query.isActive = true;
  } else if (filters.status === 'inactive') {
    query.isActive = false;
  }
  // 'all' doesn't add isActive to query

  // Search filtering
  if (filters.search) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');
    query.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  const total = await Category.countDocuments(query);
  const categories = await Category.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    categories,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getCategoryById = async (
  storeId: string,
  categoryId: string
): Promise<ICategory> => {
  const category = await Category.findOne({ _id: categoryId, storeId });
  if (!category) {
    throw new ApiError('Category not found.', 404);
  }
  return category;
};

export const updateCategory = async (
  storeId: string,
  categoryId: string,
  data: { name?: string; description?: string; imageUrl?: string }
): Promise<ICategory> => {
  const category = await Category.findOne({ _id: categoryId, storeId });
  if (!category) {
    throw new ApiError('Category not found.', 404);
  }

  if (data.name && data.name.trim().toLowerCase() !== category.name.toLowerCase()) {
    const existingName = await Category.findOne({
      storeId,
      _id: { $ne: categoryId },
      name: { $regex: new RegExp(`^${data.name.trim()}$`, 'i') },
    });
    if (existingName) {
      throw new ApiError('Another category with this name already exists in your store.', 400);
    }
    category.name = data.name.trim();
  }

  if (data.description !== undefined) {
    category.description = data.description;
  }

  if (data.imageUrl !== undefined) {
    category.imageUrl = data.imageUrl;
  }

  return await category.save();
};

export const toggleCategoryStatus = async (
  storeId: string,
  categoryId: string
): Promise<ICategory> => {
  const category = await Category.findOne({ _id: categoryId, storeId });
  if (!category) {
    throw new ApiError('Category not found.', 404);
  }

  category.isActive = !category.isActive;
  return await category.save();
};

export const deleteCategory = async (
  storeId: string,
  categoryId: string
): Promise<void> => {
  const category = await Category.findOne({ _id: categoryId, storeId });
  if (!category) {
    throw new ApiError('Category not found.', 404);
  }

  // Check if any items belong to this category
  const itemCounts = await Item.countDocuments({ categoryId, storeId });
  if (itemCounts > 0) {
    throw new ApiError(
      `Cannot delete category '${category.name}' because it contains ${itemCounts} item(s). Please reassign or delete the items, or deactivate this category instead.`,
      400
    );
  }

  await category.deleteOne();
};

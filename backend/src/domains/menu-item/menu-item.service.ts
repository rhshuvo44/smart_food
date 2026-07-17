import mongoose from 'mongoose';
import { MenuItem } from '../../models/index.js';
import { NotFoundError } from '../../shared/errors.js';

export interface CreateMenuItemData {
  name: string;
  description: string;
  price: number;
  currency?: string;
  category: string;
  imageUrl?: string;
  preparationTime: number;
  dietaryTags?: string[];
}

export interface UpdateMenuItemData {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  imageUrl?: string;
  preparationTime?: number;
  dietaryTags?: string[];
}

export async function getMenuItems(
  restaurantId: string,
  options: { category?: string; page?: number; limit?: number } = {},
) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 50));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { restaurantId };
  if (options.category) {
    filter.category = options.category;
  }

  const [items, total] = await Promise.all([
    MenuItem.find(filter).sort({ category: 1, name: 1 }).skip(skip).limit(limit),
    MenuItem.countDocuments(filter),
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getMenuItemById(itemId: string) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new NotFoundError('Invalid menu item ID');
  }

  const item = await MenuItem.findById(itemId);
  if (!item) {
    throw new NotFoundError('Menu item not found');
  }

  return item;
}

export async function createMenuItem(restaurantId: string, data: CreateMenuItemData) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const item = new MenuItem({
    restaurantId,
    name: data.name,
    description: data.description,
    price: data.price,
    currency: data.currency ?? 'USD',
    category: data.category,
    imageUrl: data.imageUrl,
    preparationTime: data.preparationTime,
    dietaryTags: data.dietaryTags ?? [],
  });

  await item.save();
  return item;
}

export async function updateMenuItem(itemId: string, data: UpdateMenuItemData) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new NotFoundError('Invalid menu item ID');
  }

  const item = await MenuItem.findByIdAndUpdate(
    itemId,
    { $set: data },
    { new: true, runValidators: true },
  );

  if (!item) {
    throw new NotFoundError('Menu item not found');
  }

  return item;
}

export async function deleteMenuItem(itemId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new NotFoundError('Invalid menu item ID');
  }

  const item = await MenuItem.findByIdAndDelete(itemId);
  if (!item) {
    throw new NotFoundError('Menu item not found');
  }
}

export async function toggleAvailability(itemId: string) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new NotFoundError('Invalid menu item ID');
  }

  const item = await MenuItem.findById(itemId);
  if (!item) {
    throw new NotFoundError('Menu item not found');
  }

  item.isAvailable = !item.isAvailable;
  await item.save();

  return item;
}

export async function getCategories(restaurantId: string) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const categories = await MenuItem.distinct('category', { restaurantId });
  return categories;
}

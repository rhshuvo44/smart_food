import mongoose from 'mongoose';
import { Restaurant } from '../../../models/index.js';
import { NotFoundError } from '../../../shared/errors.js';

interface ListRestaurantsParams {
  status?: string;
  search?: string;
  isApproved?: string;
  page: number;
  limit: number;
}

export async function listAllRestaurants(params: ListRestaurantsParams) {
  const query: Record<string, unknown> = {};

  if (params.status === 'active') query.isActive = true;
  else if (params.status === 'inactive') query.isActive = false;

  if (params.isApproved === 'true') query.isApproved = true;
  else if (params.isApproved === 'false') query.isApproved = false;

  if (params.search) {
    const searchRegex = new RegExp(params.search, 'i');
    query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
  }

  const skip = (params.page - 1) * params.limit;

  const [restaurants, total] = await Promise.all([
    Restaurant.find(query).sort({ createdAt: -1 }).skip(skip).limit(params.limit).lean(),
    Restaurant.countDocuments(query),
  ]);

  return {
    restaurants,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function getRestaurantDetail(restaurantId: string) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const restaurant = await Restaurant.findById(restaurantId).lean();

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  return restaurant;
}

export async function updateRestaurantStatus(restaurantId: string, isActive: boolean) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    restaurantId,
    { $set: { isActive } },
    { new: true },
  ).lean();

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  return restaurant;
}

export async function approveRestaurant(restaurantId: string) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    restaurantId,
    { $set: { isApproved: true, isActive: true } },
    { new: true },
  ).lean();

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  return restaurant;
}

import mongoose from 'mongoose';
import { Restaurant, User, Order, MenuItem } from '../../models/index.js';
import { NotFoundError } from '../../shared/errors.js';
import type { IBusinessHours } from '@smartfood/shared';

export interface UpdateRestaurantData {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  deliveryRadius?: number;
  deliveryFee?: number;
  minimumOrder?: number;
}

export interface RestaurantStats {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  menuItemsCount: number;
  averageRating: number;
}

export async function getRestaurantByOwner(ownerPublicId: string) {
  const user = await User.findOne({ publicId: ownerPublicId });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const restaurant = await Restaurant.findOne({ ownerId: user._id });
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found for this owner');
  }

  return restaurant;
}

export async function getRestaurantById(restaurantId: string) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  return restaurant;
}

export async function updateRestaurant(restaurantId: string, data: UpdateRestaurantData) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    restaurantId,
    { $set: data },
    { new: true, runValidators: true },
  );

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  return restaurant;
}

export async function getRestaurantStats(restaurantId: string): Promise<RestaurantStats> {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const objectId = new mongoose.Types.ObjectId(restaurantId);

  const [orderStats] = await Order.aggregate([
    { $match: { restaurantId: objectId } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        activeOrders: {
          $sum: {
            $cond: [{ $in: ['$status', ['pending', 'confirmed', 'preparing']] }, 1, 0],
          },
        },
        totalRevenue: {
          $sum: {
            $cond: [{ $in: ['$status', ['delivered', 'completed']] }, '$total', 0],
          },
        },
      },
    },
  ]);

  const menuItemsCount = await MenuItem.countDocuments({ restaurantId: objectId });

  const restaurant = await Restaurant.findById(restaurantId);

  return {
    totalOrders: orderStats?.totalOrders ?? 0,
    activeOrders: orderStats?.activeOrders ?? 0,
    totalRevenue: Math.round((orderStats?.totalRevenue ?? 0) * 100) / 100,
    menuItemsCount,
    averageRating: restaurant?.rating ?? 0,
  };
}

export async function updateBusinessHours(restaurantId: string, hours: IBusinessHours[]) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    restaurantId,
    { $set: { businessHours: hours } },
    { new: true },
  );

  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  return restaurant;
}

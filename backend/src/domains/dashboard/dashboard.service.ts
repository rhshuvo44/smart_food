import mongoose from 'mongoose';
import { Order, MenuItem, Restaurant } from '../../models/index.js';
import { NotFoundError } from '../../shared/errors.js';

export async function getRestaurantDashboard(restaurantId: string) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const objectId = new mongoose.Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw new NotFoundError('Restaurant not found');
  }

  // Stats
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

  const stats = {
    totalOrders: orderStats?.totalOrders ?? 0,
    activeOrders: orderStats?.activeOrders ?? 0,
    totalRevenue: Math.round((orderStats?.totalRevenue ?? 0) * 100) / 100,
    menuItemsCount,
    averageRating: restaurant.rating ?? 0,
  };

  // Recent orders
  const recentOrders = await Order.find({ restaurantId: objectId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('customerId', 'firstName lastName')
    .lean();

  // Order status counts
  const statusCounts = await Order.aggregate([
    { $match: { restaurantId: objectId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const orderStatusCounts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const item of statusCounts) {
    orderStatusCounts[item._id] = item.count;
  }

  // Today's revenue
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayRevenueResult = await Order.aggregate([
    {
      $match: {
        restaurantId: objectId,
        status: { $in: ['delivered', 'completed'] },
        createdAt: { $gte: todayStart },
      },
    },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);

  const todayRevenue = Math.round((todayRevenueResult[0]?.total ?? 0) * 100) / 100;

  // Popular items: top 5 most ordered menu items
  const popularItems = await Order.aggregate([
    { $match: { restaurantId: objectId } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.menuItemId',
        name: { $first: '$items.name' },
        totalOrdered: { $sum: '$items.quantity' },
      },
    },
    { $sort: { totalOrdered: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 0,
        menuItemId: '$_id',
        name: 1,
        totalOrdered: 1,
      },
    },
  ]);

  return {
    stats,
    recentOrders,
    orderStatusCounts,
    todayRevenue,
    popularItems,
  };
}

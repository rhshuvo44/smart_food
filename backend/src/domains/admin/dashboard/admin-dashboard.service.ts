import { Order, Restaurant, User, MenuItem } from '../../../models/index.js';

export async function getAdminDashboard() {
  const [userCount, restaurantCount, menuItemCount, orderStats] = await Promise.all([
    User.countDocuments({}),
    Restaurant.countDocuments({}),
    MenuItem.countDocuments({}),
    Order.aggregate([
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
    ]),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayStats = await Promise.all([
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    Restaurant.countDocuments({ createdAt: { $gte: todayStart } }),
    Order.countDocuments({ createdAt: { $gte: todayStart } }),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart },
          status: { $in: ['delivered', 'completed'] },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  const recentOrders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('customerId', 'firstName lastName')
    .lean();

  const topRestaurants = await Order.aggregate([
    { $match: { status: { $in: ['delivered', 'completed'] } } },
    { $group: { _id: '$restaurantId', totalOrders: { $sum: 1 }, revenue: { $sum: '$total' } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'restaurants',
        localField: '_id',
        foreignField: '_id',
        as: 'restaurant',
      },
    },
    { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        restaurantId: '$_id',
        name: { $ifNull: ['$restaurant.name', 'Unknown'] },
        totalOrders: 1,
        revenue: { $round: ['$revenue', 2] },
      },
    },
  ]);

  const orderStatusCounts = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusCounts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const item of orderStatusCounts) {
    statusCounts[item._id] = item.count;
  }

  return {
    stats: {
      totalUsers: userCount,
      totalRestaurants: restaurantCount,
      totalMenuItems: menuItemCount,
      totalOrders: orderStats[0]?.totalOrders ?? 0,
      activeOrders: orderStats[0]?.activeOrders ?? 0,
      totalRevenue: Math.round((orderStats[0]?.totalRevenue ?? 0) * 100) / 100,
    },
    todayStats: {
      newUsers: todayStats[0],
      newRestaurants: todayStats[1],
      newOrders: todayStats[2],
      todayRevenue: Math.round((todayStats[3][0]?.total ?? 0) * 100) / 100,
    },
    recentOrders,
    orderStatusCounts: statusCounts,
    topRestaurants,
  };
}

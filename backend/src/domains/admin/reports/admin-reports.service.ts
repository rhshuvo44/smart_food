import { User, Order, Restaurant, MenuItem } from '../../../models/index.js';

export async function getUsersReport() {
  const users = await User.find({})
    .select(
      '-passwordHash -refreshTokenVersion -failedLoginAttempts -lockoutUntil -passwordResetToken -passwordResetExpires',
    )
    .sort({ createdAt: -1 })
    .lean();

  return { total: users.length, users };
}

export async function getOrdersReport() {
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .populate('customerId', 'firstName lastName email')
    .lean();

  const totalRevenue = orders
    .filter((o) => ['delivered', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return { total: orders.length, totalRevenue, orders };
}

export async function getRevenueReport() {
  const orders = await Order.find({ status: { $in: ['delivered', 'completed'] } })
    .sort({ createdAt: -1 })
    .select('restaurantId total createdAt')
    .lean();

  const byRestaurant = await Order.aggregate([
    { $match: { status: { $in: ['delivered', 'completed'] } } },
    { $group: { _id: '$restaurantId', revenue: { $sum: '$total' }, orderCount: { $sum: 1 } } },
    { $sort: { revenue: -1 } },
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  return { totalRevenue, totalOrders: orders.length, byRestaurant };
}

export async function getRestaurantsReport() {
  const restaurants = await Restaurant.find({}).sort({ createdAt: -1 }).lean();

  const enriched = await Promise.all(
    restaurants.map(async (r) => {
      const menuCount = await MenuItem.countDocuments({ restaurantId: r._id });
      const orderStats = await Order.aggregate([
        { $match: { restaurantId: r._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $in: ['$status', ['delivered', 'completed']] }, '$total', 0],
              },
            },
          },
        },
      ]);

      return {
        id: r._id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        cuisine: r.cuisine,
        rating: r.rating,
        isActive: r.isActive,
        isApproved: r.isApproved,
        menuItems: menuCount,
        totalOrders: orderStats[0]?.totalOrders ?? 0,
        revenue: Math.round((orderStats[0]?.revenue ?? 0) * 100) / 100,
        createdAt: r.createdAt,
      };
    }),
  );

  return { total: enriched.length, restaurants: enriched };
}

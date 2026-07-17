import { Order, User } from '../../../models/index.js';

function getPeriodDays(period: string): number {
  const map: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
  return map[period] ?? 30;
}

export async function getRevenueAnalytics(period: string) {
  const days = getPeriodDays(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const revenueByDay = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $in: ['delivered', 'completed'] },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalRevenue = revenueByDay.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = revenueByDay.reduce((sum, d) => sum + d.orderCount, 0);

  return {
    period: days,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
    revenueByDay,
  };
}

export async function getOrderAnalytics(period: string) {
  const days = getPeriodDays(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const statusDistribution = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const ordersByDay = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    period: days,
    statusDistribution,
    ordersByDay,
  };
}

export async function getUserAnalytics(period: string) {
  const days = getPeriodDays(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const totalUsers = await User.countDocuments({});
  const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });

  const registrationsByDay = await User.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const roleDistribution = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);

  return {
    totalUsers,
    newUsers,
    registrationsByDay,
    roleDistribution,
  };
}

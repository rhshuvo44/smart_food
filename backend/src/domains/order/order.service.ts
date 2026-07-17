import mongoose from 'mongoose';
import { Order } from '../../models/index.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';
import { OrderStatus, isValidTransition } from '@smartfood/shared';

export async function getRestaurantOrders(
  restaurantId: string,
  options: { page?: number; limit?: number; status?: string } = {},
) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { restaurantId };
  if (options.status) {
    filter.status = options.status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'firstName lastName email')
      .populate('driverId', 'firstName lastName'),
    Order.countDocuments(filter),
  ]);

  return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getOrdersByStatus(
  restaurantId: string,
  statuses: string[],
  options: { page?: number; limit?: number } = {},
) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const filter = { restaurantId, status: { $in: statuses } };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'firstName lastName email'),
    Order.countDocuments(filter),
  ]);

  return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getOrderById(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new NotFoundError('Invalid order ID');
  }

  const order = await Order.findById(orderId)
    .populate('customerId', 'firstName lastName email phone')
    .populate('restaurantId', 'name')
    .populate('driverId', 'firstName lastName phone');

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  return order;
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new NotFoundError('Invalid order ID');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Validate that the new status is a valid OrderStatus value
  const validStatuses = Object.values(OrderStatus);
  if (!validStatuses.includes(newStatus as (typeof OrderStatus)[keyof typeof OrderStatus])) {
    throw new ValidationError(`Invalid status value: "${newStatus}"`);
  }

  // Validate status transition
  if (
    !isValidTransition(order.status, newStatus as (typeof OrderStatus)[keyof typeof OrderStatus])
  ) {
    throw new ValidationError(`Invalid status transition from "${order.status}" to "${newStatus}"`);
  }

  order.status = newStatus as (typeof OrderStatus)[keyof typeof OrderStatus];
  await order.save();

  return order;
}

export async function getOrderStatusCounts(restaurantId: string) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new NotFoundError('Invalid restaurant ID');
  }

  const objectId = new mongoose.Types.ObjectId(restaurantId);

  const counts = await Order.aggregate([
    { $match: { restaurantId: objectId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusMap: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const item of counts) {
    statusMap[item._id] = item.count;
  }

  return statusMap;
}

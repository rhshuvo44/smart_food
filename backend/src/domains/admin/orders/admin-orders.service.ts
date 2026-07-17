import mongoose from 'mongoose';
import { Order } from '../../../models/index.js';
import { NotFoundError } from '../../../shared/errors.js';

interface ListOrdersParams {
  status?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function getAllOrders(params: ListOrdersParams) {
  const query: Record<string, unknown> = {};

  if (params.status) {
    query.status = params.status;
  }

  if (params.search) {
    if (mongoose.Types.ObjectId.isValid(params.search)) {
      query.$or = [
        { _id: new mongoose.Types.ObjectId(params.search) },
        { customerId: new mongoose.Types.ObjectId(params.search) },
      ];
    } else {
      query._id = params.search;
    }
  }

  const skip = (params.page - 1) * params.limit;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .populate('customerId', 'firstName lastName email')
      .lean(),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function getOrderDetail(orderId: string) {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new NotFoundError('Invalid order ID');
  }

  const order = await Order.findById(orderId)
    .populate('customerId', 'firstName lastName email phone')
    .populate('restaurantId', 'name phone')
    .lean();

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  return order;
}

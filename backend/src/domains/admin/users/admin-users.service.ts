import mongoose from 'mongoose';
import { User, Order } from '../../../models/index.js';
import { NotFoundError } from '../../../shared/errors.js';
import { UserRole } from '@smartfood/shared';

interface ListUsersParams {
  role?: string;
  status?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function listUsers(params: ListUsersParams) {
  const query: Record<string, unknown> = {};

  if (params.role && Object.values(UserRole).includes(params.role as any)) {
    query.role = params.role;
  }

  if (params.status === 'active') query.isActive = true;
  else if (params.status === 'inactive') query.isActive = false;

  if (params.search) {
    const searchRegex = new RegExp(params.search, 'i');
    query.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }];
  }

  const skip = (params.page - 1) * params.limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select(
        '-passwordHash -refreshTokenVersion -failedLoginAttempts -lockoutUntil -passwordResetToken -passwordResetExpires',
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function getUserById(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new NotFoundError('Invalid user ID');
  }

  const user = await User.findById(userId)
    .select(
      '-passwordHash -refreshTokenVersion -failedLoginAttempts -lockoutUntil -passwordResetToken -passwordResetExpires',
    )
    .lean();

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function updateUser(
  userId: string,
  updates: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    isActive: boolean;
  }>,
) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new NotFoundError('Invalid user ID');
  }

  const allowedFields = ['firstName', 'lastName', 'phone', 'role', 'isActive'];
  const sanitized: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (updates[field as keyof typeof updates] !== undefined) {
      sanitized[field] = updates[field as keyof typeof updates];
    }
  }

  if (sanitized.role && !Object.values(UserRole).includes(sanitized.role as any)) {
    throw new NotFoundError('Invalid role');
  }

  const user = await User.findByIdAndUpdate(userId, { $set: sanitized }, { new: true })
    .select(
      '-passwordHash -refreshTokenVersion -failedLoginAttempts -lockoutUntil -passwordResetToken -passwordResetExpires',
    )
    .lean();

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function getUserOrders(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new NotFoundError('Invalid user ID');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const orders = await Order.find({ customerId: user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return orders;
}

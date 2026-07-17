import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, type IUserDocument } from '../../models/user.model.js';
import { env } from '../../config/env.js';
import { ConflictError, AuthError } from '../../shared/errors.js';
import { logger } from '../../config/logger.js';
import { UserRole, type IAuthTokens, type IUser } from '@smartfood/shared';

interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface LoginParams {
  email: string;
  password: string;
}

function generateTokens(user: IUserDocument): IAuthTokens {
  const payload = {
    sub: user.publicId,
    role: user.role,
    version: user.refreshTokenVersion,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: 900,
  };
}

function toUserJSON(user: IUserDocument): IUser {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role as IUser['role'],
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function registerUser(params: RegisterParams): Promise<{
  user: IUser;
  tokens: IAuthTokens;
}> {
  const existing = await User.findOne({ email: params.email.toLowerCase() });
  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  const user = new User({
    email: params.email,
    passwordHash: params.password, // pre-save hook will hash it
    firstName: params.firstName,
    lastName: params.lastName,
    phone: params.phone,
    role: UserRole.CUSTOMER,
  });

  await user.save();
  const tokens = generateTokens(user);

  return { user: toUserJSON(user), tokens };
}

export async function loginUser(params: LoginParams): Promise<{
  user: IUser;
  tokens: IAuthTokens;
}> {
  const user = await User.findOne({ email: params.email.toLowerCase() }).select(
    '+passwordHash +failedLoginAttempts +lockoutUntil',
  );
  if (!user) {
    throw new AuthError('Invalid email or password');
  }

  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    throw new AuthError('Account temporarily locked. Try again later.');
  }

  const isMatch = await user.comparePassword(params.password);
  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await user.save();
    throw new AuthError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new AuthError('Account has been deactivated');
  }

  user.lastLoginAt = new Date();
  user.failedLoginAttempts = 0;
  user.lockoutUntil = undefined;
  await user.save();

  const tokens = generateTokens(user);
  return { user: toUserJSON(user), tokens };
}

export async function refreshAccessToken(refreshToken: string): Promise<IAuthTokens> {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
      sub: string;
      role: string;
      version: number;
    };

    const user = await User.findOne({ publicId: decoded.sub });
    if (!user || !user.isActive) {
      throw new AuthError('Invalid refresh token');
    }

    if (user.refreshTokenVersion !== decoded.version) {
      throw new AuthError('Refresh token has been revoked');
    }

    user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
    await user.save();

    return generateTokens(user);
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError('Invalid or expired refresh token');
  }
}

export async function logoutUser(publicId: string): Promise<void> {
  const user = await User.findOne({ publicId });
  if (user) {
    user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
    await user.save();
  }
}

export async function getProfile(publicId: string): Promise<IUser> {
  const user = await User.findOne({ publicId });
  if (!user) {
    throw new AuthError('User not found');
  }
  return toUserJSON(user);
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = resetTokenHash;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
  if (env.NODE_ENV === 'development') {
    logger.info(`Password reset link for ${email}: ${resetUrl}`);
  }

  return { message: 'If that email exists, a reset link has been sent.' };
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: resetTokenHash,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AuthError('Invalid or expired reset token');
  }

  user.passwordHash = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  await user.save();

  return { message: 'Password has been reset successfully.' };
}

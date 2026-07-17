import type { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  getProfile,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
  logoutUser,
} from './auth.service.js';

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, firstName, lastName, phone } = req.body;

  const result = await registerUser({ email, password, firstName, lastName, phone });

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      tokens: result.tokens,
    },
    correlationId: req.correlationId,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const result = await loginUser({ email, password });

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      tokens: result.tokens,
    },
    correlationId: req.correlationId,
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;

  const tokens = await refreshAccessToken(refreshToken);

  res.status(200).json({
    success: true,
    data: { tokens },
    correlationId: req.correlationId,
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  const result = await forgotPasswordService(email);

  res.status(200).json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body;

  const result = await resetPasswordService(token, password);

  res.status(200).json({
    success: true,
    data: result,
    correlationId: req.correlationId,
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (userId) {
    await logoutUser(userId);
  }

  res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' },
    correlationId: req.correlationId,
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res
      .status(401)
      .json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    return;
  }
  const user = await getProfile(userId);

  res.status(200).json({
    success: true,
    data: { user },
    correlationId: req.correlationId,
  });
}

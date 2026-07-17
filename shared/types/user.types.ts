import type { UserRole } from '../constants/user-roles.js';
import type { IAddress } from './common.types.js';

export interface IUser {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserAddress {
  id: string;
  userId: string;
  label: string;
  address: IAddress;
  isDefault: boolean;
  geoPoint: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

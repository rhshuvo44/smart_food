import type { IGeoPoint } from './common.types.js';

export interface IBusinessHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface IMenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime: number;
  dietaryTags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRestaurant {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  cuisine: string[];
  address: IGeoPoint;
  phone: string;
  email: string;
  imageUrl?: string;
  coverImageUrl?: string;
  businessHours: IBusinessHours[];
  deliveryRadius: number;
  deliveryFee: number;
  minimumOrder: number;
  rating: number;
  isActive: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

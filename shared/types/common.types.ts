export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formatted: string;
}

export interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number];
  address: IAddress;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    pagination?: IPagination;
    timestamp: string;
  };
  correlationId: string;
}

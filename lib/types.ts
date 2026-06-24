// Response models
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PreorderResponse {
  id: number;
  name: string;
  products: number;
  preorderWhen: string;
  startsAt: string; // ISO string
  endsAt: string | null; // ISO string
  isActive: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Error codes
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

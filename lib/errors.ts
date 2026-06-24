import { NextResponse } from 'next/server';
import { ApiResponse, ErrorCode } from './types';

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleError(error: any): NextResponse {
  console.error('API Error:', error);

  let statusCode = 500;
  let code = ErrorCode.INTERNAL_ERROR;
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof SyntaxError) {
    statusCode = 400;
    code = ErrorCode.BAD_REQUEST;
    message = 'Invalid JSON in request body';
  } else if (error?.code === 'P2002') {
    // Prisma unique constraint error
    statusCode = 409;
    code = ErrorCode.VALIDATION_ERROR;
    message = 'Duplicate entry: this record already exists';
  } else if (error?.code === 'P2025') {
    // Prisma not found error
    statusCode = 404;
    code = ErrorCode.NOT_FOUND;
    message = 'Record not found';
  } else if (error?.code === 'P2003') {
    // Prisma foreign key error
    statusCode = 400;
    code = ErrorCode.VALIDATION_ERROR;
    message = 'Invalid reference to related record';
  } else if (error?.message?.includes('Invalid')) {
    statusCode = 400;
    code = ErrorCode.VALIDATION_ERROR;
    message = error.message;
  }

  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: statusCode });
}

export function successResponse<T>(data: T, statusCode: number = 200): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: statusCode });
}

export function validateDateFormat(dateString: string | undefined): Date {
  if (!dateString) {
    throw new ApiError(
      ErrorCode.INVALID_DATE_FORMAT,
      'Date field is required',
      400
    );
  }

  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    throw new ApiError(
      ErrorCode.INVALID_DATE_FORMAT,
      `Invalid date format: "${dateString}". Please use ISO 8601 format (e.g., "2024-12-31T23:59:59Z" or "2024-12-31")`,
      400,
      { received: dateString }
    );
  }

  return date;
}

export function validateRequiredField(
  value: any,
  fieldName: string,
  fieldType: string = 'string'
): void {
  if (value === undefined || value === null || value === '') {
    throw new ApiError(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} is required`,
      400,
      { field: fieldName, type: fieldType }
    );
  }
}

export function validateNumberField(
  value: any,
  fieldName: string,
  minValue?: number
): number {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    throw new ApiError(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} must be a number`,
      400,
      { field: fieldName, received: value }
    );
  }

  if (minValue !== undefined && num < minValue) {
    throw new ApiError(
      ErrorCode.VALIDATION_ERROR,
      `${fieldName} must be at least ${minValue}`,
      400,
      { field: fieldName, minValue, received: num }
    );
  }

  return num;
}

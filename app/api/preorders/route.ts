import { NextRequest } from 'next/server';

import {
  handleError,
  successResponse,
  validateDateFormat,
  validateRequiredField,
  validateNumberField,
  ApiError,
} from '@/lib/errors';
import { ErrorCode, PaginatedResponse, PreorderResponse } from '@/lib/types';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = validateNumberField(searchParams.get('page') || '1', 'page', 1);
    const limit = validateNumberField(searchParams.get('limit') || '8', 'limit', 1);
    const filter = searchParams.get('filter') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() as 'asc' | 'desc';

    // Validate sortOrder
    if (!['asc', 'desc'].includes(sortOrder)) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'sortOrder must be "asc" or "desc"',
        400
      );
    }

    // Validate filter
    if (!['all', 'active', 'inactive'].includes(filter)) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'filter must be "all", "active", or "inactive"',
        400
      );
    }

    // Validate sortBy
    const validSortFields = ['name', 'createdAt', 'startsAt', 'endsAt'];
    if (!validSortFields.includes(sortBy)) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        `sortBy must be one of: ${validSortFields.join(', ')}`,
        400
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause based on filter
    const where: any = {};
    if (filter === 'active') {
      where.isActive = true;
    } else if (filter === 'inactive') {
      where.isActive = false;
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get total count
    const total = await prisma.preorder.count({ where });

    // Get preorders
    const preorders = await prisma.preorder.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });

    // Format response with ISO dates
    const formattedPreorders: PreorderResponse[] = preorders.map((p: any) => ({
      ...p,
      startsAt: p.startsAt.toISOString(),
      endsAt: p.endsAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    const response: PaginatedResponse<PreorderResponse> = {
      items: formattedPreorders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    return successResponse(response);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    validateRequiredField(body.name, 'name', 'string');
    validateRequiredField(body.products, 'products', 'number');
    validateRequiredField(body.preorderWhen, 'preorderWhen', 'string');
    validateRequiredField(body.startsAt, 'startsAt', 'date');

    // Validate and parse dates
    const startsAt = validateDateFormat(body.startsAt);
    const endsAt = body.endsAt ? validateDateFormat(body.endsAt) : null;

    // Validate products is a number
    const products = validateNumberField(body.products, 'products', 0);

    // Validate startsAt is not in the past
    if (startsAt < new Date()) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'startsAt must be in the future',
        400
      );
    }

    // If endsAt is provided, validate it's after startsAt
    if (endsAt && endsAt <= startsAt) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'endsAt must be after startsAt',
        400
      );
    }

    const preorder = await prisma.preorder.create({
      data: {
        name: body.name,
        products,
        preorderWhen: body.preorderWhen,
        startsAt,
        endsAt,
        isActive: body.isActive ?? true,
      },
    });

    // Format response
    const response: PreorderResponse = {
      ...preorder,
      startsAt: preorder.startsAt.toISOString(),
      endsAt: preorder.endsAt?.toISOString() || null,
      createdAt: preorder.createdAt.toISOString(),
      updatedAt: preorder.updatedAt.toISOString(),
    };

    return successResponse(response, 201);
  } catch (error) {
    return handleError(error);
  }
}

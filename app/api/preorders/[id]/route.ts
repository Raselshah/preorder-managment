import { NextRequest } from 'next/server';

import {
  handleError,
  successResponse,
  validateDateFormat,
  validateRequiredField,
  validateNumberField,
  ApiError,
} from '@/lib/errors';
import { ErrorCode, PreorderResponse } from '@/lib/types';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
  try {
     const { id } = await params;
    const numId = validateNumberField(id, 'id', 1);

    const preorder = await prisma.preorder.findUnique({
      where: { id : numId},
    });

    if (!preorder) {
      throw new ApiError(
        ErrorCode.NOT_FOUND,
        `Preorder with id ${numId} not found`,
        404
      );
    }

    // Format response
    const response: PreorderResponse = {
      ...preorder,
      startsAt: preorder.startsAt.toISOString(),
      endsAt: preorder.endsAt?.toISOString() || null,
      createdAt: preorder.createdAt.toISOString(),
      updatedAt: preorder.updatedAt.toISOString(),
    };

    return successResponse(response);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = validateNumberField(id, 'id', 1);
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

    // If endsAt is provided, validate it's after startsAt
    if (endsAt && endsAt <= startsAt) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'endsAt must be after startsAt',
        400
      );
    }

    // Check if preorder exists
    const existing = await prisma.preorder.findUnique({ where: { id: numId } });
    if (!existing) {
      throw new ApiError(
        ErrorCode.NOT_FOUND,
        `Preorder with id ${numId} not found`,
        404
      );
    }

    const preorder = await prisma.preorder.update({
      where: { id: numId },
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

    return successResponse(response);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = validateNumberField(id, 'id', 1);
    // Check if preorder exists
    const existing = await prisma.preorder.findUnique({ where: { id: numId } });
    if (!existing) {
      throw new ApiError(
        ErrorCode.NOT_FOUND,
        `Preorder with id ${id} not found`,
        404
      );
    }

    await prisma.preorder.delete({
      where: { id: numId },
    });

    return successResponse(
      { message: 'Preorder deleted successfully', id },
      200
    );
  } catch (error) {
    return handleError(error);
  }
}

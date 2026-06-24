import { NextRequest } from 'next/server';

import {
  handleError,
  successResponse,
  validateNumberField,
  ApiError,
} from '@/lib/errors';
import { ErrorCode, PreorderResponse } from '@/lib/types';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
  try {
      const { id } = await params;
    const numId = validateNumberField(id, 'id', 1);
    console.log("ids",params)
    const body = await request.json();

    // Validate isActive is a boolean
    if (typeof body.isActive !== 'boolean') {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'isActive must be a boolean',
        400,
        { field: 'isActive', received: typeof body.isActive }
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
        isActive: body.isActive,
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

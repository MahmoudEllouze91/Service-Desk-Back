import { BadRequestException } from '@nestjs/common';
import { RequestStatus } from '../../generated/prisma/client.js';

export interface CreateStatusHistoryDto {
  status: RequestStatus;
  requestId: string;
  assigningUserId?: string | null;
}

function requireObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Status history body must be an object');
  }
  return value as Record<string, unknown>;
}

function requireString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string`);
  }
  return value;
}

export function validateStatusHistoryId(id: string): string {
  if (id.trim().length === 0) {
    throw new BadRequestException(
      'Status history id must be a non-empty string',
    );
  }
  return id;
}

export function validateCreateStatusHistory(
  value: unknown,
): CreateStatusHistoryDto {
  const body = requireObject(value);
  const unknownFields = Object.keys(body).filter(
    (field) => !['status', 'requestId', 'assigningUserId'].includes(field),
  );
  if (unknownFields.length > 0) {
    throw new BadRequestException(
      `Unknown status history field(s): ${unknownFields.join(', ')}`,
    );
  }

  const status =
    typeof body.status === 'string'
      ? Object.values(RequestStatus).find(
          (candidate) => candidate === body.status,
        )
      : undefined;
  if (status === undefined) {
    throw new BadRequestException(
      `status must be one of: ${Object.values(RequestStatus).join(', ')}`,
    );
  }

  return {
    status,
    requestId: requireString(body, 'requestId'),
    ...(Object.hasOwn(body, 'assigningUserId')
      ? {
          assigningUserId:
            body.assigningUserId === null
              ? null
              : requireString(body, 'assigningUserId'),
        }
      : {}),
  };
}

export function validateRequestId(requestId: string): string {
  if (requestId.trim().length === 0) {
    throw new BadRequestException('Request id must be a non-empty string');
  }
  return requestId;
}

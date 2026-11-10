import { BadRequestException } from '@nestjs/common';
import {
  RequestStatus,
  Urgency,
} from '../../generated/prisma/client.js';

export interface CreateRequestDto {
  title: string;
  description: string;
  category: string;
  status: RequestStatus;
  urgency: Urgency;
  userCreatorId: string;
  assignedOperatorId?: string | null;
}

export interface UpdateRequestDto {
  title?: string;
  description?: string;
  category?: string;
  status?: RequestStatus;
  urgency?: Urgency;
  assignedOperatorId?: string | null;
}

const createFields = [
  'title',
  'description',
  'category',
  'status',
  'urgency',
  'userCreatorId',
  'assignedOperatorId',
] as const;

const updateFields = [
  'title',
  'description',
  'category',
  'status',
  'urgency',
  'assignedOperatorId',
] as const;

function requireObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Request body must be an object');
  }
  return value as Record<string, unknown>;
}

function rejectUnknownFields(
  body: Record<string, unknown>,
  allowedFields: readonly string[],
): void {
  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field),
  );
  if (unknownFields.length > 0) {
    throw new BadRequestException(
      `Unknown request field(s): ${unknownFields.join(', ')}`,
    );
  }
}

function requireString(
  body: Record<string, unknown>,
  field: string,
): string {
  const value = body[field];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string`);
  }
  return value;
}

function requireEnum<T extends string>(
  body: Record<string, unknown>,
  field: string,
  values: Record<string, T>,
): T {
  const value = body[field];
  const allowedValue = Object.values(values).find(
    (candidate) => candidate === value,
  );
  if (typeof value !== 'string' || allowedValue === undefined) {
    throw new BadRequestException(
      `${field} must be one of: ${Object.values(values).join(', ')}`,
    );
  }
  return allowedValue;
}

function optionalAssignedOperatorId(
  body: Record<string, unknown>,
): string | null | undefined {
  if (!Object.hasOwn(body, 'assignedOperatorId')) {
    return undefined;
  }
  if (body.assignedOperatorId === null) {
    return null;
  }
  return requireString(body, 'assignedOperatorId');
}

export function validateRequestId(id: string): string {
  if (id.trim().length === 0) {
    throw new BadRequestException('Request id must be a non-empty string');
  }
  return id;
}

export function validateCreateRequest(value: unknown): CreateRequestDto {
  const body = requireObject(value);
  rejectUnknownFields(body, createFields);

  return {
    title: requireString(body, 'title'),
    description: requireString(body, 'description'),
    category: requireString(body, 'category'),
    status: requireEnum(body, 'status', RequestStatus),
    urgency: requireEnum(body, 'urgency', Urgency),
    userCreatorId: requireString(body, 'userCreatorId'),
    assignedOperatorId: optionalAssignedOperatorId(body),
  };
}

export function validateUpdateRequest(value: unknown): UpdateRequestDto {
  const body = requireObject(value);
  rejectUnknownFields(body, updateFields);
  if (Object.keys(body).length === 0) {
    throw new BadRequestException('At least one request field is required');
  }

  const update: UpdateRequestDto = {};
  if (Object.hasOwn(body, 'title')) {
    update.title = requireString(body, 'title');
  }
  if (Object.hasOwn(body, 'description')) {
    update.description = requireString(body, 'description');
  }
  if (Object.hasOwn(body, 'category')) {
    update.category = requireString(body, 'category');
  }
  if (Object.hasOwn(body, 'status')) {
    update.status = requireEnum(body, 'status', RequestStatus);
  }
  if (Object.hasOwn(body, 'urgency')) {
    update.urgency = requireEnum(body, 'urgency', Urgency);
  }
  if (Object.hasOwn(body, 'assignedOperatorId')) {
    update.assignedOperatorId = optionalAssignedOperatorId(body);
  }
  return update;
}

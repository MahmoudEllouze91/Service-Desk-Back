import { BadRequestException } from '@nestjs/common';
import { Role } from '../../generated/prisma/client.js';

export interface CreateUserDto {
  email: string;
  firstname?: string | null;
  lastname?: string | null;
  role: Role;
}

export interface UpdateUserDto {
  email?: string;
  firstname?: string | null;
  lastname?: string | null;
  role?: Role;
}

const userFields = ['email', 'firstname', 'lastname', 'role'] as const;

function requireObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('User body must be an object');
  }
  return value as Record<string, unknown>;
}

function rejectUnknownFields(body: Record<string, unknown>): void {
  const unknownFields = Object.keys(body).filter(
    (field) => !userFields.includes(field as (typeof userFields)[number]),
  );
  if (unknownFields.length > 0) {
    throw new BadRequestException(
      `Unknown user field(s): ${unknownFields.join(', ')}`,
    );
  }
}

function requireEmail(body: Record<string, unknown>): string {
  const email = body.email;
  if (
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw new BadRequestException('email must be a valid email address');
  }
  return email.trim();
}

function requireRole(body: Record<string, unknown>): Role {
  const role = body.role;
  const validRole =
    typeof role === 'string'
      ? Object.values(Role).find((candidate) => candidate === role)
      : undefined;
  if (validRole === undefined) {
    throw new BadRequestException(
      `role must be one of: ${Object.values(Role).join(', ')}`,
    );
  }
  return validRole;
}

function optionalName(
  body: Record<string, unknown>,
  field: 'firstname' | 'lastname',
): string | null | undefined {
  if (!Object.hasOwn(body, field)) {
    return undefined;
  }
  const value = body[field];
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(
      `${field} must be a non-empty string or null`,
    );
  }
  return value.trim();
}

export function validateUserId(id: string): string {
  if (id.trim().length === 0) {
    throw new BadRequestException('User id must be a non-empty string');
  }
  return id;
}

export function validateCreateUser(value: unknown): CreateUserDto {
  const body = requireObject(value);
  rejectUnknownFields(body);
  return {
    email: requireEmail(body),
    firstname: optionalName(body, 'firstname'),
    lastname: optionalName(body, 'lastname'),
    role: requireRole(body),
  };
}

export function validateUpdateUser(value: unknown): UpdateUserDto {
  const body = requireObject(value);
  rejectUnknownFields(body);
  if (Object.keys(body).length === 0) {
    throw new BadRequestException('At least one user field is required');
  }

  const update: UpdateUserDto = {};
  if (Object.hasOwn(body, 'email')) {
    update.email = requireEmail(body);
  }
  if (Object.hasOwn(body, 'firstname')) {
    update.firstname = optionalName(body, 'firstname');
  }
  if (Object.hasOwn(body, 'lastname')) {
    update.lastname = optionalName(body, 'lastname');
  }
  if (Object.hasOwn(body, 'role')) {
    update.role = requireRole(body);
  }
  return update;
}

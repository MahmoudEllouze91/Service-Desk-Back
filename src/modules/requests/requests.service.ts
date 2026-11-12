import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateRequestDto,
  RequestPagination,
  UpdateRequestDto,
} from './requests.dto.js';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({
    page,
    pageSize,
    title,
    status,
    sortBy,
    sortOrder,
  }: RequestPagination) {
    const where = {
      ...(title ? { title: { contains: title } } : {}),
      ...(status ? { status } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.request.count({ where }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findOne(id: string) {
    const request = await this.prisma.request.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException(`Request ${id} was not found`);
    }
    return request;
  }

  async create(data: CreateRequestDto) {
    try {
      return await this.prisma.request.create({ data });
    } catch (error) {
      this.throwForInvalidRelation(error);
      throw error;
    }
  }

  async update(id: string, data: UpdateRequestDto) {
    try {
      return await this.prisma.request.update({ where: { id }, data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Request ${id} was not found`);
      }
      this.throwForInvalidRelation(error);
      throw error;
    }
  }

  private throwForInvalidRelation(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw new BadRequestException(
        'The referenced creator or assigned operator does not exist',
      );
    }
  }
}

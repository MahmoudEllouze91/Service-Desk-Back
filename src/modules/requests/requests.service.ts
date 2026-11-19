import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '../../generated/prisma/client.js';
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
        include: {
          userCreator: {
            select: { firstname: true, lastname: true, email: true },
          },
          assignedOperator: {
            select: { firstname: true, lastname: true, email: true },
          },
        },
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
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        userCreator: {
          select: { firstname: true, lastname: true, email: true },
        },
        assignedOperator: {
          select: { firstname: true, lastname: true, email: true },
        },
        statusHistory: {
          include: {
            assigningUser: {
              select: { firstname: true, lastname: true, email: true },
            },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
    if (!request) {
      throw new NotFoundException(`Request ${id} was not found`);
    }
    return request;
  }

  async create(data: CreateRequestDto) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const request = await transaction.request.create({ data });
        await transaction.statusHistory.create({
          data: {
            requestId: request.id,
            status: request.status,
            assigningUserId: null,
          },
        });
        return request;
      });
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

  async advanceStatus(id: string) {
    return this.prisma.$transaction(async (transaction) => {
      const request = await transaction.request.findUnique({ where: { id } });
      if (!request) {
        throw new NotFoundException(`Request ${id} was not found`);
      }

      const nextStatus: Partial<Record<RequestStatus, RequestStatus>> = {
        [RequestStatus.NEW]: RequestStatus.IN_PROGRESS,
        [RequestStatus.IN_PROGRESS]: RequestStatus.RESOLVED,
      };
      const status = nextStatus[request.status];
      if (!status) {
        throw new ConflictException(
          'A resolved request cannot advance to another status',
        );
      }

      const result = await transaction.request.updateMany({
        where: { id, status: request.status },
        data: { status },
      });
      if (result.count !== 1) {
        throw new ConflictException(
          'The request status changed before this update could be applied',
        );
      }

      await transaction.statusHistory.create({
        data: {
          requestId: id,
          status,
          assigningUserId: null,
        },
      });

      return { ...request, status };
    });
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

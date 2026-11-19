import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateStatusHistoryDto } from './status-history.dto.js';

const historyRelations = {
  request: { select: { id: true, title: true } },
  assigningUser: {
    select: { id: true, firstname: true, lastname: true, email: true },
  },
} as const;

@Injectable()
export class StatusHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(requestId?: string) {
    return this.prisma.statusHistory.findMany({
      ...(requestId ? { where: { requestId } } : {}),
      include: historyRelations,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: string) {
    const history = await this.prisma.statusHistory.findUnique({
      where: { id },
      include: historyRelations,
    });
    if (!history) {
      throw new NotFoundException(`Status history ${id} was not found`);
    }
    return history;
  }

  async create(data: CreateStatusHistoryDto) {
    try {
      return await this.prisma.statusHistory.create({
        data,
        include: historyRelations,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'The referenced request or assigning user does not exist',
        );
      }
      throw error;
    }
  }
}

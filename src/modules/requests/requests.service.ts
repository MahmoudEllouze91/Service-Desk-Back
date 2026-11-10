import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  CreateRequestDto,
  UpdateRequestDto,
} from './requests.dto.js';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.request.findMany();
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

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(private readonly prismaService: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async onApplicationBootstrap(): Promise<void> {
    const users = await this.prismaService.user.findMany();
    console.log('Users:', users);
  }
}

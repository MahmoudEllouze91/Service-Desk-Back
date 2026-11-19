import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { StatusHistoryController } from './status-history.controller.js';
import { StatusHistoryService } from './status-history.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [StatusHistoryController],
  providers: [StatusHistoryService],
})
export class StatusHistoryModule {}

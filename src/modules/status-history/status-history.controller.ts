import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  validateCreateStatusHistory,
  validateRequestId,
  validateStatusHistoryId,
} from './status-history.dto.js';
import { StatusHistoryService } from './status-history.service.js';

@Controller('status-history')
export class StatusHistoryController {
  constructor(private readonly statusHistoryService: StatusHistoryService) {}

  @Get()
  findAll(@Query('requestId') requestId?: string) {
    return this.statusHistoryService.findAll(
      requestId === undefined ? undefined : validateRequestId(requestId),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.statusHistoryService.findOne(validateStatusHistoryId(id));
  }

  @Post()
  create(@Body() body: unknown) {
    return this.statusHistoryService.create(validateCreateStatusHistory(body));
  }
}

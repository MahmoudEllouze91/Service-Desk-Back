import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequestsService } from './requests.service.js';
import {
  validateCreateRequest,
  validateRequestPagination,
  validateRequestId,
  validateUpdateRequest,
} from './requests.dto.js';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('title') title?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.requestsService.findAll(
      validateRequestPagination(
        page,
        pageSize,
        title,
        status,
        sortBy,
        sortOrder,
      ),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestsService.findOne(validateRequestId(id));
  }

  @Post()
  create(@Body() body: unknown) {
    return this.requestsService.create(validateCreateRequest(body));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.requestsService.update(
      validateRequestId(id),
      validateUpdateRequest(body),
    );
  }
}

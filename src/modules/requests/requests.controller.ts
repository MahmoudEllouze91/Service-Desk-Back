import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RequestsService } from './requests.service.js';
import {
  validateCreateRequest,
  validateRequestId,
  validateUpdateRequest,
} from './requests.dto.js';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  findAll() {
    return this.requestsService.findAll();
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

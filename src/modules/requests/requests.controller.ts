import { Controller, Get } from '@nestjs/common';
import { RequestsService } from './requests.service.js';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  findAll() {
    return this.requestsService.findAll();
  }
}

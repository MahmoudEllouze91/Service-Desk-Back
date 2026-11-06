import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller.js';
import { RequestsService } from './requests.service.js';

describe('RequestsController', () => {
  let controller: RequestsController;
  const requestsService = {
    findAll: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestsService, useValue: requestsService }],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns all requests from the service', async () => {
    const requests = [{ id: 'request-1' }];
    requestsService.findAll.mockResolvedValue(requests);

    await expect(controller.findAll()).resolves.toBe(requests);
    expect(requestsService.findAll).toHaveBeenCalledOnce();
  });
});

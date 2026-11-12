import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller.js';
import { RequestsService } from './requests.service.js';

describe('RequestsController', () => {
  let controller: RequestsController;
  const requestsService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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
    const result = {
      items: [{ id: 'request-1' }],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    };
    requestsService.findAll.mockResolvedValue(result);

    await expect(controller.findAll()).resolves.toBe(result);
    expect(requestsService.findAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('passes validated pagination query parameters to the service', async () => {
    requestsService.findAll.mockResolvedValue({});

    await controller.findAll('3', '25');

    expect(requestsService.findAll).toHaveBeenCalledWith({
      page: 3,
      pageSize: 25,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('passes validated title, status, and sorting parameters to the service', async () => {
    requestsService.findAll.mockResolvedValue({});

    await controller.findAll(
      '2',
      '10',
      'printer',
      'IN_PROGRESS',
      'title',
      'asc',
    );

    expect(requestsService.findAll).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      title: 'printer',
      status: 'IN_PROGRESS',
      sortBy: 'title',
      sortOrder: 'asc',
    });
  });

  it('rejects invalid pagination query parameters', () => {
    expect(() => controller.findAll('0', '10')).toThrow(
      'page must be a positive integer',
    );
    expect(() => controller.findAll('1', '101')).toThrow(
      'pageSize must not exceed 100',
    );
    expect(() => controller.findAll('1', '10', undefined, 'INVALID')).toThrow(
      'status must be one of:',
    );
    expect(() =>
      controller.findAll('1', '10', undefined, undefined, 'unknown'),
    ).toThrow('sortBy must be one of:');
    expect(() =>
      controller.findAll('1', '10', undefined, undefined, 'title', 'sideways'),
    ).toThrow('sortOrder must be one of:');
    expect(requestsService.findAll).not.toHaveBeenCalled();
  });

  it('returns a request by id', async () => {
    const request = { id: 'request-1' };
    requestsService.findOne.mockResolvedValue(request);

    await expect(controller.findOne('request-1')).resolves.toBe(request);
    expect(requestsService.findOne).toHaveBeenCalledWith('request-1');
  });

  it('creates a request after validating its fields', async () => {
    const body = {
      title: 'Cannot sign in',
      description: 'Sign-in fails',
      category: 'Access',
      status: 'NEW',
      urgency: 'HIGH',
      userCreatorId: 'user-1',
    };
    const created = { id: 'request-1', ...body };
    requestsService.create.mockResolvedValue(created);

    await expect(controller.create(body)).resolves.toBe(created);
    expect(requestsService.create).toHaveBeenCalledWith(body);
  });

  it('rejects invalid create fields', () => {
    expect(() =>
      controller.create({
        title: ' ',
        description: 'Sign-in fails',
        category: 'Access',
        status: 'INVALID',
        urgency: 'HIGH',
        userCreatorId: 'user-1',
      }),
    ).toThrow('title must be a non-empty string');
    expect(requestsService.create).not.toHaveBeenCalled();
  });

  it('updates a request after validating its fields', async () => {
    const body = { status: 'IN_PROGRESS', assignedOperatorId: null };
    const updated = { id: 'request-1', ...body };
    requestsService.update.mockResolvedValue(updated);

    await expect(controller.update('request-1', body)).resolves.toBe(updated);
    expect(requestsService.update).toHaveBeenCalledWith('request-1', body);
  });

  it('rejects empty or invalid update fields', () => {
    expect(() => controller.update('request-1', {})).toThrow(
      'At least one request field is required',
    );
    expect(() =>
      controller.update('request-1', { urgency: 'URGENT' }),
    ).toThrow('urgency must be one of');
    expect(requestsService.update).not.toHaveBeenCalled();
  });
});

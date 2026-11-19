import { Test, TestingModule } from '@nestjs/testing';
import { StatusHistoryController } from './status-history.controller.js';
import { StatusHistoryService } from './status-history.service.js';

describe('StatusHistoryController', () => {
  let controller: StatusHistoryController;
  const statusHistoryService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusHistoryController],
      providers: [
        { provide: StatusHistoryService, useValue: statusHistoryService },
      ],
    }).compile();

    controller = module.get<StatusHistoryController>(StatusHistoryController);
  });

  it('lists all history or filters by request id', async () => {
    statusHistoryService.findAll.mockResolvedValue([]);

    await controller.findAll();
    expect(statusHistoryService.findAll).toHaveBeenCalledWith(undefined);
    await controller.findAll('request-1');
    expect(statusHistoryService.findAll).toHaveBeenLastCalledWith('request-1');
    expect(() => controller.findAll(' ')).toThrow(
      'Request id must be a non-empty string',
    );
  });

  it('gets one status history record', async () => {
    const history = { id: 'history-1', status: 'NEW' };
    statusHistoryService.findOne.mockResolvedValue(history);

    await expect(controller.findOne('history-1')).resolves.toBe(history);
    expect(statusHistoryService.findOne).toHaveBeenCalledWith('history-1');
    expect(() => controller.findOne(' ')).toThrow(
      'Status history id must be a non-empty string',
    );
  });

  it('validates and creates a history record', async () => {
    const data = {
      status: 'RESOLVED',
      requestId: 'request-1',
      assigningUserId: 'user-1',
    };
    statusHistoryService.create.mockResolvedValue({ id: 'history-1', ...data });

    await expect(controller.create(data)).resolves.toEqual({
      id: 'history-1',
      ...data,
    });
    expect(statusHistoryService.create).toHaveBeenCalledWith(data);
    expect(() => controller.create({ ...data, status: 'INVALID' })).toThrow(
      'status must be one of',
    );
    expect(() => controller.create({ ...data, unexpected: true })).toThrow(
      'Unknown status history field(s): unexpected',
    );
    expect(statusHistoryService.create).toHaveBeenCalledTimes(1);
  });

  it('allows status history creation without an actor', async () => {
    const data = {
      status: 'IN_PROGRESS',
      requestId: 'request-1',
    };
    statusHistoryService.create.mockResolvedValue({ id: 'history-2', ...data });

    await expect(controller.create(data)).resolves.toEqual({
      id: 'history-2',
      ...data,
    });
    expect(statusHistoryService.create).toHaveBeenCalledWith(data);
  });
});

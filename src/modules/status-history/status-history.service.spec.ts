import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StatusHistoryService } from './status-history.service.js';

describe('StatusHistoryService', () => {
  let service: StatusHistoryService;
  const prisma = {
    statusHistory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusHistoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<StatusHistoryService>(StatusHistoryService);
  });

  it('lists status history in chronological order, optionally by request', async () => {
    prisma.statusHistory.findMany.mockResolvedValue([]);

    await expect(service.findAll('request-1')).resolves.toEqual([]);
    expect(prisma.statusHistory.findMany).toHaveBeenCalledWith({
      where: { requestId: 'request-1' },
      include: {
        request: { select: { id: true, title: true } },
        assigningUser: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    await service.findAll();
    expect(prisma.statusHistory.findMany).toHaveBeenLastCalledWith({
      include: {
        request: { select: { id: true, title: true } },
        assigningUser: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  });

  it('fetches a history record and reports missing records', async () => {
    const history = { id: 'history-1', status: 'NEW' };
    prisma.statusHistory.findUnique
      .mockResolvedValueOnce(history)
      .mockResolvedValueOnce(null);

    await expect(service.findOne('history-1')).resolves.toBe(history);
    await expect(service.findOne('missing')).rejects.toThrow(
      'Status history missing was not found',
    );
    expect(prisma.statusHistory.findUnique).toHaveBeenCalledWith({
      where: { id: 'history-1' },
      include: {
        request: { select: { id: true, title: true } },
        assigningUser: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
      },
    });
  });

  it('creates a status history record with its related request and user', async () => {
    const data = {
      status: 'IN_PROGRESS' as const,
      requestId: 'request-1',
      assigningUserId: 'user-1',
    };
    const history = { id: 'history-1', ...data };
    prisma.statusHistory.create.mockResolvedValue(history);

    await expect(service.create(data)).resolves.toBe(history);
    expect(prisma.statusHistory.create).toHaveBeenCalledWith({
      data,
      include: {
        request: { select: { id: true, title: true } },
        assigningUser: {
          select: { id: true, firstname: true, lastname: true, email: true },
        },
      },
    });
  });
});

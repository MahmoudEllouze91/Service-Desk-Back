import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RequestsService } from './requests.service.js';

describe('RequestsService', () => {
  let service: RequestsService;
  const transaction = {
    request: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    statusHistory: {
      create: vi.fn(),
    },
  };
  const prisma = {
    request: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('fetches a page of requests and the total count from Prisma', async () => {
    const requests = [{ id: 'request-1' }];
    prisma.request.findMany.mockResolvedValue(requests);
    prisma.request.count.mockResolvedValue(21);

    await expect(
      service.findAll({
        page: 2,
        pageSize: 10,
        status: 'NEW',
        title: 'login',
        sortBy: 'title',
        sortOrder: 'asc',
      }),
    ).resolves.toEqual({
      items: requests,
      page: 2,
      pageSize: 10,
      total: 21,
      totalPages: 3,
    });
    expect(prisma.request.findMany).toHaveBeenCalledWith({
      where: {
        title: { contains: 'login' },
        status: 'NEW',
      },
      include: {
        userCreator: {
          select: { firstname: true, lastname: true, email: true },
        },
        assignedOperator: {
          select: { firstname: true, lastname: true, email: true },
        },
      },
      orderBy: [{ title: 'asc' }, { id: 'asc' }],
      skip: 10,
      take: 10,
    });
    expect(prisma.request.count).toHaveBeenCalledWith({
      where: {
        title: { contains: 'login' },
        status: 'NEW',
      },
    });
  });

  it('fetches a request by id', async () => {
    const request = { id: 'request-1' };
    prisma.request.findUnique.mockResolvedValue(request);

    await expect(service.findOne('request-1')).resolves.toBe(request);
    expect(prisma.request.findUnique).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      include: {
        userCreator: {
          select: { firstname: true, lastname: true, email: true },
        },
        assignedOperator: {
          select: { firstname: true, lastname: true, email: true },
        },
        statusHistory: {
          include: {
            assigningUser: {
              select: { firstname: true, lastname: true, email: true },
            },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
  });

  it('throws not found when a request does not exist', async () => {
    prisma.request.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow(
      'Request missing was not found',
    );
  });

  it('creates a request with the validated fields', async () => {
    const data = {
      title: 'Cannot sign in',
      description: 'Sign-in fails',
      category: 'Access',
      status: 'NEW' as const,
      urgency: 'HIGH' as const,
      userCreatorId: 'user-1',
    };
    const created = { id: 'request-1', ...data };
    transaction.request.create.mockResolvedValue(created);
    transaction.statusHistory.create.mockResolvedValue({});

    await expect(service.create(data)).resolves.toBe(created);
    expect(transaction.request.create).toHaveBeenCalledWith({ data });
    expect(transaction.statusHistory.create).toHaveBeenCalledWith({
      data: {
        requestId: 'request-1',
        status: 'NEW',
        assigningUserId: null,
      },
    });
  });

  it('updates a request by id', async () => {
    const data = { status: 'RESOLVED' as const };
    const updated = { id: 'request-1', ...data };
    prisma.request.update.mockResolvedValue(updated);

    await expect(service.update('request-1', data)).resolves.toBe(updated);
    expect(prisma.request.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data,
    });
  });

  it('advances to the next status and records history without an actor', async () => {
    const request = {
      id: 'request-1',
      status: 'NEW' as const,
      title: 'Cannot sign in',
    };
    transaction.request.findUnique.mockResolvedValue(request);
    transaction.request.updateMany.mockResolvedValue({ count: 1 });
    transaction.statusHistory.create.mockResolvedValue({});

    await expect(service.advanceStatus('request-1')).resolves.toEqual({
      ...request,
      status: 'IN_PROGRESS',
    });
    expect(transaction.request.updateMany).toHaveBeenCalledWith({
      where: { id: 'request-1', status: 'NEW' },
      data: { status: 'IN_PROGRESS' },
    });
    expect(transaction.statusHistory.create).toHaveBeenCalledWith({
      data: {
        requestId: 'request-1',
        status: 'IN_PROGRESS',
        assigningUserId: null,
      },
    });
  });

  it('advances in progress requests to resolved', async () => {
    transaction.request.findUnique.mockResolvedValue({
      id: 'request-1',
      status: 'IN_PROGRESS',
    });
    transaction.request.updateMany.mockResolvedValue({ count: 1 });
    transaction.statusHistory.create.mockResolvedValue({});

    await expect(service.advanceStatus('request-1')).resolves.toMatchObject({
      status: 'RESOLVED',
    });
    expect(transaction.statusHistory.create).toHaveBeenCalledWith({
      data: {
        requestId: 'request-1',
        status: 'RESOLVED',
        assigningUserId: null,
      },
    });
  });

  it('rejects missing, resolved, or concurrently changed requests', async () => {
    transaction.request.findUnique.mockResolvedValueOnce(null);
    await expect(service.advanceStatus('missing')).rejects.toThrow(
      'Request missing was not found',
    );

    transaction.request.findUnique.mockResolvedValueOnce({
      id: 'request-1',
      status: 'RESOLVED',
    });
    await expect(service.advanceStatus('request-1')).rejects.toThrow(
      'A resolved request cannot advance to another status',
    );

    transaction.request.findUnique.mockResolvedValueOnce({
      id: 'request-1',
      status: 'NEW',
    });
    transaction.request.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(service.advanceStatus('request-1')).rejects.toThrow(
      'The request status changed before this update could be applied',
    );
    expect(transaction.statusHistory.create).not.toHaveBeenCalled();
  });
});

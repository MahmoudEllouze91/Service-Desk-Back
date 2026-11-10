import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RequestsService } from './requests.service.js';

describe('RequestsService', () => {
  let service: RequestsService;
  const prisma = {
    request: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
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

  it('fetches all requests from Prisma', async () => {
    const requests = [{ id: 'request-1' }];
    prisma.request.findMany.mockResolvedValue(requests);

    await expect(service.findAll()).resolves.toBe(requests);
    expect(prisma.request.findMany).toHaveBeenCalledWith();
  });

  it('fetches a request by id', async () => {
    const request = { id: 'request-1' };
    prisma.request.findUnique.mockResolvedValue(request);

    await expect(service.findOne('request-1')).resolves.toBe(request);
    expect(prisma.request.findUnique).toHaveBeenCalledWith({
      where: { id: 'request-1' },
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
    prisma.request.create.mockResolvedValue(created);

    await expect(service.create(data)).resolves.toBe(created);
    expect(prisma.request.create).toHaveBeenCalledWith({ data });
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
});

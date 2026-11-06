import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RequestsService } from './requests.service.js';

describe('RequestsService', () => {
  let service: RequestsService;
  const prisma = {
    request: {
      findMany: vi.fn(),
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
});

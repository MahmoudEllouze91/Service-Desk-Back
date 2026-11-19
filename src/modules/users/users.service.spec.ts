import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('lists users ordered by email', async () => {
    const users = [{ id: 'user-1', email: 'user@example.com' }];
    prisma.user.findMany.mockResolvedValue(users);

    await expect(service.findAll()).resolves.toBe(users);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      orderBy: { email: 'asc' },
    });
  });

  it('fetches a user by id and reports missing users', async () => {
    const user = { id: 'user-1', email: 'user@example.com' };
    prisma.user.findUnique
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(null);

    await expect(service.findOne('user-1')).resolves.toBe(user);
    await expect(service.findOne('missing')).rejects.toThrow(
      'User missing was not found',
    );
  });

  it('creates, updates, and deletes users', async () => {
    const data = {
      email: 'new@example.com',
      firstname: 'New',
      role: 'REQUESTER' as const,
    };
    const created = { id: 'user-1', ...data };
    const update = { firstname: 'Updated' };
    const updated = { ...created, ...update };
    prisma.user.create.mockResolvedValue(created);
    prisma.user.update.mockResolvedValue(updated);
    prisma.user.delete.mockResolvedValue(updated);

    await expect(service.create(data)).resolves.toBe(created);
    expect(prisma.user.create).toHaveBeenCalledWith({ data });
    await expect(service.update('user-1', update)).resolves.toBe(updated);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: update,
    });
    await expect(service.remove('user-1')).resolves.toBe(updated);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });
});

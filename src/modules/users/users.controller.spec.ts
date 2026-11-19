import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('lists and fetches users', async () => {
    const users = [{ id: 'user-1', email: 'user@example.com' }];
    usersService.findAll.mockResolvedValue(users);
    usersService.findOne.mockResolvedValue(users[0]);

    await expect(controller.findAll()).resolves.toBe(users);
    await expect(controller.findOne('user-1')).resolves.toBe(users[0]);
    expect(usersService.findOne).toHaveBeenCalledWith('user-1');
  });

  it('creates a user after validating its fields', async () => {
    const body = {
      email: ' person@example.com ',
      firstname: 'Person',
      role: 'REQUESTER',
    };
    const created = { id: 'user-1', ...body, email: 'person@example.com' };
    usersService.create.mockResolvedValue(created);

    await expect(controller.create(body)).resolves.toBe(created);
    expect(usersService.create).toHaveBeenCalledWith({
      email: 'person@example.com',
      firstname: 'Person',
      lastname: undefined,
      role: 'REQUESTER',
    });
  });

  it('updates and deletes users', async () => {
    const body = { role: 'OPERATOR' };
    usersService.update.mockResolvedValue({ id: 'user-1', ...body });
    usersService.remove.mockResolvedValue({ id: 'user-1' });

    await expect(controller.update('user-1', body)).resolves.toEqual({
      id: 'user-1',
      role: 'OPERATOR',
    });
    expect(usersService.update).toHaveBeenCalledWith('user-1', body);
    await expect(controller.remove('user-1')).resolves.toEqual({
      id: 'user-1',
    });
    expect(usersService.remove).toHaveBeenCalledWith('user-1');
  });

  it('rejects invalid user fields and empty identifiers', () => {
    expect(() =>
      controller.create({ email: 'not-an-email', role: 'REQUESTER' }),
    ).toThrow('email must be a valid email address');
    expect(() =>
      controller.create({ email: 'user@example.com', role: 'INVALID' }),
    ).toThrow('role must be one of');
    expect(() => controller.update('user-1', {})).toThrow(
      'At least one user field is required',
    );
    expect(() => controller.findOne(' ')).toThrow(
      'User id must be a non-empty string',
    );
    expect(usersService.create).not.toHaveBeenCalled();
    expect(usersService.update).not.toHaveBeenCalled();
  });
});

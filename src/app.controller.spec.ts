import { Test, TestingModule } from '@nestjs/testing';
import { afterEach } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let findMany: ReturnType<typeof vi.fn>;
  const users = [{ id: 1, email: 'user@example.com', name: 'User' }];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    findMany = vi.fn().mockResolvedValue(users);
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: { user: { findMany } },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('logs the users when the application starts', async () => {
      const consoleLog = vi
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      await appService.onApplicationBootstrap();

      expect(findMany).toHaveBeenCalledOnce();
      expect(consoleLog).toHaveBeenCalledWith('Users:', users);
    });
  });
});

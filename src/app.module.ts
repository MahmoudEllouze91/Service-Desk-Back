import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RequestsModule } from './modules/requests/requests.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { StatusHistoryModule } from './modules/status-history/status-history.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    PrismaModule,
    //TODO Add Observe app key and secret to .env to use ObserveModule
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'service-desk-back',
    }),
    RequestsModule,
    UsersModule,
    StatusHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

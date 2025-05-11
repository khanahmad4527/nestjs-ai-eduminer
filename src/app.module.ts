import { Module } from '@nestjs/common';
import { ScrapeModule } from './routes/scrape/scrape.module';
import { PingModule } from './routes/ping/ping.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { validate } from './env.validation';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guard/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate }),
    CacheModule.register({
      isGlobal: true,
      ttl: 86400000,
    }),
    ScrapeModule,
    PingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}

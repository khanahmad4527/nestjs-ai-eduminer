import { Module } from '@nestjs/common';
import { ScrapeModule } from './routes/scrape/scrape.module';
import { PingModule } from './routes/ping/ping.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { validate } from './env.validation';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guard/auth.guard';
import { createKeyv } from '@keyv/redis';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate }),
    CacheModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          stores: [createKeyv(configService.get('REDIS_URL'))],
          ttl: 86400000, // 1 day in ms
        };
      },
      inject: [ConfigService],
      isGlobal: true,
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

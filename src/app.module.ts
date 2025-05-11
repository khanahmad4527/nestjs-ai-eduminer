import { Module } from '@nestjs/common';
import { ScrapeModule } from './routes/scrape/scrape.module';

@Module({
  imports: [ScrapeModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

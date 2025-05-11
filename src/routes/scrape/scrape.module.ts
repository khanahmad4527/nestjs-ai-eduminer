import { Module } from '@nestjs/common';
import { ScrapeService } from './scrape.service';
import { ScrapeController } from './scrape.controller';

@Module({
  controllers: [ScrapeController],
  providers: [ScrapeService],
})
export class ScrapeModule {}

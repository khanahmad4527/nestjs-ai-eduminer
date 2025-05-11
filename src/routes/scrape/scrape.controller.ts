import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ScrapeService } from './scrape.service';
import { ScrapeQueryDto } from './dto/scrape-query.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('scrape')
@UseInterceptors(CacheInterceptor)
export class ScrapeController {
  constructor(private readonly scrapeService: ScrapeService) {}

  @Get()
  handleScraping(@Query() scrapeQueryDto: ScrapeQueryDto) {
    return this.scrapeService.scrapeAllSources(scrapeQueryDto);
  }
}

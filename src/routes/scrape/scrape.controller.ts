import { Body, Controller, Get, ValidationPipe } from '@nestjs/common';
import { ScrapeService } from './scrape.service';
import { ScrapeQueryDto } from './dto/scrape-query.dto';

@Controller('scrape')
export class ScrapeController {
  constructor(private readonly scrapeService: ScrapeService) {}

  @Get()
  handleScraping(@Body(ValidationPipe) scrapeQueryDto: ScrapeQueryDto) {
    return this.scrapeService.processScraping(scrapeQueryDto);
  }
}

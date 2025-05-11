import { Injectable } from '@nestjs/common';
import { ScrapeQueryDto } from './dto/scrape-query.dto';

@Injectable()
export class ScrapeService {
  processScraping(createScrapeDto: ScrapeQueryDto) {
    return 'This action adds a new scrape';
  }
}

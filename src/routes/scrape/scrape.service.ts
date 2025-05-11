import { Injectable } from '@nestjs/common';
import { CreateScrapeDto } from './dto/create-scrape.dto';
import { UpdateScrapeDto } from './dto/update-scrape.dto';

@Injectable()
export class ScrapeService {
  create(createScrapeDto: CreateScrapeDto) {
    return 'This action adds a new scrape';
  }

  findAll() {
    return `This action returns all scrape`;
  }

  findOne(id: number) {
    return `This action returns a #${id} scrape`;
  }

  update(id: number, updateScrapeDto: UpdateScrapeDto) {
    return `This action updates a #${id} scrape`;
  }

  remove(id: number) {
    return `This action removes a #${id} scrape`;
  }
}

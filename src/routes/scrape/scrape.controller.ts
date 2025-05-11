import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ScrapeService } from './scrape.service';
import { CreateScrapeDto } from './dto/create-scrape.dto';
import { UpdateScrapeDto } from './dto/update-scrape.dto';

@Controller('scrape')
export class ScrapeController {
  constructor(private readonly scrapeService: ScrapeService) {}

  @Post()
  create(@Body() createScrapeDto: CreateScrapeDto) {
    return this.scrapeService.create(createScrapeDto);
  }

  @Get()
  findAll() {
    return this.scrapeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scrapeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScrapeDto: UpdateScrapeDto) {
    return this.scrapeService.update(+id, updateScrapeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scrapeService.remove(+id);
  }
}

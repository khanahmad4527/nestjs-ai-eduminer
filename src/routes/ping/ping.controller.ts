import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/decorator/public.decorator';

@Controller()
export class PingController {
  @Public()
  @Get('ping')
  getPing() {
    return { message: 'The server is up and running!' };
  }
}

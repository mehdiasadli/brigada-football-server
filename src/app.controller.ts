import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('favicon.ico')
  getFavicon() {
    return '';
  }

  @Get()
  getRoot() {
    return {
      message: 'Brigada Football API',
      status: 'running',
      version: '1.0.0',
    };
  }
}

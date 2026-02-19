import { Controller, Get } from '@nestjs/common';
import { ExampleService } from './example.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('example')
@Controller('example')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) { }
  // Define your endpoints here
  @Get()
  getHello(): string {
    return this.exampleService.getHello();
  }
}

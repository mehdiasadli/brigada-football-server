import { Test, TestingModule } from '@nestjs/testing';
import { PollOptionsService } from './poll-options.service';

describe('PollOptionsService', () => {
  let service: PollOptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PollOptionsService],
    }).compile();

    service = module.get<PollOptionsService>(PollOptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

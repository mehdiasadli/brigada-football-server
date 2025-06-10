import { Test, TestingModule } from '@nestjs/testing';
import { PollOptionVotesService } from './poll-option-votes.service';

describe('PollOptionVotesService', () => {
  let service: PollOptionVotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PollOptionVotesService],
    }).compile();

    service = module.get<PollOptionVotesService>(PollOptionVotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

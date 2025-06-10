import { Test, TestingModule } from '@nestjs/testing';
import { PollOptionVotesController } from './poll-option-votes.controller';
import { PollOptionVotesService } from './poll-option-votes.service';

describe('PollOptionVotesController', () => {
  let controller: PollOptionVotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PollOptionVotesController],
      providers: [PollOptionVotesService],
    }).compile();

    controller = module.get<PollOptionVotesController>(PollOptionVotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

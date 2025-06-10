import { Test, TestingModule } from '@nestjs/testing';
import { PollOptionsController } from './poll-options.controller';
import { PollOptionsService } from './poll-options.service';

describe('PollOptionsController', () => {
  let controller: PollOptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PollOptionsController],
      providers: [PollOptionsService],
    }).compile();

    controller = module.get<PollOptionsController>(PollOptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { MatchResultsController } from './match-results.controller';
import { MatchResultsService } from './match-results.service';

describe('MatchResultsController', () => {
  let controller: MatchResultsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatchResultsController],
      providers: [MatchResultsService],
    }).compile();

    controller = module.get<MatchResultsController>(MatchResultsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

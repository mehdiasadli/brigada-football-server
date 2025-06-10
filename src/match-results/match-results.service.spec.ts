import { Test, TestingModule } from '@nestjs/testing';
import { MatchResultsService } from './match-results.service';

describe('MatchResultsService', () => {
  let service: MatchResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchResultsService],
    }).compile();

    service = module.get<MatchResultsService>(MatchResultsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

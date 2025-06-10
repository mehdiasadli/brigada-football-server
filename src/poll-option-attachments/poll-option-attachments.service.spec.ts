import { Test, TestingModule } from '@nestjs/testing';
import { PollOptionAttachmentsService } from './poll-option-attachments.service';

describe('PollOptionAttachmentsService', () => {
  let service: PollOptionAttachmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PollOptionAttachmentsService],
    }).compile();

    service = module.get<PollOptionAttachmentsService>(PollOptionAttachmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

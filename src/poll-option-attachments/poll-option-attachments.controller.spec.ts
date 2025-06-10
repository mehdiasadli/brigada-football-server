import { Test, TestingModule } from '@nestjs/testing';
import { PollOptionAttachmentsController } from './poll-option-attachments.controller';
import { PollOptionAttachmentsService } from './poll-option-attachments.service';

describe('PollOptionAttachmentsController', () => {
  let controller: PollOptionAttachmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PollOptionAttachmentsController],
      providers: [PollOptionAttachmentsService],
    }).compile();

    controller = module.get<PollOptionAttachmentsController>(PollOptionAttachmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

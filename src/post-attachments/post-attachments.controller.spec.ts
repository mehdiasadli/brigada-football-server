import { Test, TestingModule } from '@nestjs/testing';
import { PostAttachmentsController } from './post-attachments.controller';
import { PostAttachmentsService } from './post-attachments.service';

describe('PostAttachmentsController', () => {
  let controller: PostAttachmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostAttachmentsController],
      providers: [PostAttachmentsService],
    }).compile();

    controller = module.get<PostAttachmentsController>(PostAttachmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

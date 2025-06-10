import { Test, TestingModule } from '@nestjs/testing';
import { PostAttachmentsService } from './post-attachments.service';

describe('PostAttachmentsService', () => {
  let service: PostAttachmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostAttachmentsService],
    }).compile();

    service = module.get<PostAttachmentsService>(PostAttachmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

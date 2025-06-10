import { Injectable } from '@nestjs/common';
import { CreateMatchResultDto } from './dto/create-match-result.dto';
import { UpdateMatchResultDto } from './dto/update-match-result.dto';

@Injectable()
export class MatchResultsService {
  create(createMatchResultDto: CreateMatchResultDto) {
    return 'This action adds a new matchResult';
  }

  findAll() {
    return `This action returns all matchResults`;
  }

  findOne(id: number) {
    return `This action returns a #${id} matchResult`;
  }

  update(id: number, updateMatchResultDto: UpdateMatchResultDto) {
    return `This action updates a #${id} matchResult`;
  }

  remove(id: number) {
    return `This action removes a #${id} matchResult`;
  }
}

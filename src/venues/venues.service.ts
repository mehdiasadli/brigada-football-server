import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { SearchBuilder, SearchDto } from 'src/_common/lib/query.search';
import {
  PaginationBuilder,
  PaginationDto,
} from 'src/_common/lib/query.pagination';
import { OrderBuilder, OrderDto } from 'src/_common/lib/query.order';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { UserRole } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { check } from 'src/_common/check';

@Injectable()
export class VenuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async findOne(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: {
        id,
      },
    });

    return venue;
  }

  async getOneById(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            username: true,
          },
        },
        matches: true,
      },
    });

    return check(venue, 'Venue not found');
  }

  async findMany(
    paginationDto: PaginationDto,
    orderDto: OrderDto,
    searchDto: SearchDto,
  ) {
    const pagination = new PaginationBuilder(paginationDto);
    const order = new OrderBuilder(orderDto);
    const search = new SearchBuilder(searchDto);

    const where = search.buildWhere({
      searchableFields: [
        {
          field: 'name',
          weight: 10,
        },
        {
          field: 'address',
          weight: 5,
        },
        {
          field: 'addressDescription',
          weight: 3,
        },
      ],
    });

    const [venues, total] = await Promise.all([
      await this.prisma.venue.findMany({
        ...pagination.use(),
        where,
        orderBy: order.use(),
      }),
      this.prisma.venue.count({
        where,
      }),
    ]);

    return pagination.paginate(venues, total);
  }

  async create(createVenueDto: CreateVenueDto, currentUserId: string) {
    // Venue can be created only by ADMIN, SUPER_ADMIN
    const user = await this.usersService.getOneById(currentUserId);

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const venue = await this.prisma.venue.create({
      data: createVenueDto,
    });

    return venue;
  }

  async update(
    id: string,
    updateVenueDto: UpdateVenueDto,
    currentUserId: string,
  ) {
    const venue = await this.findOne(id);

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const user = await this.usersService.getOneById(currentUserId);

    if (user.role !== UserRole.SUPER_ADMIN && venue.creatorId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return await this.prisma.venue.update({
      where: {
        id,
      },
      data: updateVenueDto,
    });
  }

  async delete(id: string, currentUserId: string) {
    const venue = await this.findOne(id);

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const user = await this.usersService.getOneById(currentUserId);

    if (user.role !== UserRole.SUPER_ADMIN && venue.creatorId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.venue.delete({
      where: {
        id,
      },
    });
  }
}

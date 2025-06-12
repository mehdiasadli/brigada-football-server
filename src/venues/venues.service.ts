import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
// import { SearchBuilder, SearchDto } from 'src/_common/lib/query.search';
import {
  PaginationBuilder,
  PaginationDto,
} from 'src/_common/lib/query.pagination';
import { OrderBuilder, OrderDto } from 'src/_common/lib/query.order';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { MatchStatus, UserRole } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import { check } from 'src/_common/check';
import { createMockVenues } from 'src/_common/mock/venues';

@Injectable()
export class VenuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async createMock(count: number, currentUserId: string) {
    const venues = createMockVenues(count);

    return await Promise.all(
      venues.map((venue) => this.create(venue, currentUserId)),
    );
  }

  async getVenuesForMap() {
    return await this.prisma.venue.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
      },
    });
  }

  async searchVenues(query: string) {
    const trimmedQuery = query.trim().toLowerCase();

    return await this.prisma.$queryRaw`
      SELECT
        id,
        name,
        address,
        GREATEST(
          -- Exact matches get highest score
          CASE
            WHEN LOWER(name) = ${trimmedQuery} THEN 1.0
            WHEN LOWER(address) = ${trimmedQuery} THEN 1.0
            WHEN LOWER(name || ' ' || address) = ${trimmedQuery} THEN 1.0
            ELSE 0
          END,
          -- Starts with matches (great for partial typing)
          CASE
            WHEN LOWER(name) LIKE ${trimmedQuery + '%'} THEN 0.9
            WHEN LOWER(address) LIKE ${trimmedQuery + '%'} THEN 0.9
            WHEN LOWER(name || ' ' || address) LIKE ${trimmedQuery + '%'} THEN 0.9
            ELSE 0
          END,
          -- Contains matches (for middle parts)
          CASE
            WHEN LOWER(name) LIKE ${'%' + trimmedQuery + '%'} THEN 0.7
            WHEN LOWER(address) LIKE ${'%' + trimmedQuery + '%'} THEN 0.7
            WHEN LOWER(name || ' ' || address) LIKE ${'%' + trimmedQuery + '%'} THEN 0.7
            ELSE 0
          END,
          -- Trigram similarity (for fuzzy matches like typos)
          GREATEST(
            similarity(LOWER(name), ${trimmedQuery}),
            similarity(LOWER(address), ${trimmedQuery}),
            similarity(LOWER(name || ' ' || address), ${trimmedQuery})
          ) * 0.5 -- Scale down trigram scores
        ) as relevance_score
      FROM venues
      WHERE
              -- Starts with (catches "hann" → "Hannah")
              LOWER(name) LIKE ${trimmedQuery + '%'}
              OR LOWER(address) LIKE ${trimmedQuery + '%'}
              OR LOWER(name || ' ' || address) LIKE ${trimmedQuery + '%'}
              
              -- Contains (catches partial matches)
              OR LOWER(name) LIKE ${'%' + trimmedQuery + '%'}
              OR LOWER(address) LIKE ${'%' + trimmedQuery + '%'}
              OR LOWER(name || ' ' || address) LIKE ${'%' + trimmedQuery + '%'}
              
              -- Trigram similarity with lower threshold (catches "hnnh" → "Hannah")
              OR similarity(LOWER(name), ${trimmedQuery}) > 0.2
              OR similarity(LOWER(address), ${trimmedQuery}) > 0.2
              OR similarity(LOWER(name || ' ' || address), ${trimmedQuery}) > 0.2
      ORDER BY relevance_score DESC
    `;
  }

  async getVenuesStats() {
    const totalVenues = await this.prisma.venue.count();
    const activeVenues = await this.prisma.venue.count({
      where: {
        matches: {
          some: {
            status: MatchStatus.COMPLETED,
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            },
          },
        },
      },
    });

    return {
      totalVenues,
      activeVenues,
    };
  }

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
    // searchDto: SearchDto,
  ) {
    const pagination = new PaginationBuilder(paginationDto);
    const order = new OrderBuilder(orderDto);
    // const search = new SearchBuilder(searchDto);

    const [venues, total] = await Promise.all([
      await this.prisma.venue.findMany({
        ...pagination.use(),
        orderBy: order.use(),
      }),
      this.prisma.venue.count(),
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

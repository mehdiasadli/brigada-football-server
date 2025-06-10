import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { MatchesModule } from './matches/matches.module';
import { MatchResultsModule } from './match-results/match-results.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { InvitationsModule } from './invitations/invitations.module';
import { VenuesModule } from './venues/venues.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { MentionsModule } from './mentions/mentions.module';
import { PostAttachmentsModule } from './post-attachments/post-attachments.module';
import { PollsModule } from './polls/polls.module';
import { PollOptionsModule } from './poll-options/poll-options.module';
import { PollOptionVotesModule } from './poll-option-votes/poll-option-votes.module';
import { PollOptionAttachmentsModule } from './poll-option-attachments/poll-option-attachments.module';
import { PrismaModule } from './prisma/prisma.module';
import { appConfig } from './_common/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppExceptionFilter } from './_common/app-exception.filter';
import { AuthGuard } from './auth/guards/auth.guard';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { ResponseInterceptor } from './_common/interceptors/respose.interceptor';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: appConfig.JWT_SECRET,
      signOptions: {
        issuer: appConfig.APP_NAME,
      },
      verifyOptions: {
        ignoreExpiration: true,
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [appConfig.THROTTLER_DATA],
      errorMessage: 'Too many requests, please try again later.',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    UserPreferencesModule,
    MatchesModule,
    MatchResultsModule,
    TeamsModule,
    PlayersModule,
    InvitationsModule,
    VenuesModule,
    FriendshipsModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    MentionsModule,
    PostAttachmentsModule,
    PollsModule,
    PollOptionsModule,
    PollOptionVotesModule,
    PollOptionAttachmentsModule,
    MailModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

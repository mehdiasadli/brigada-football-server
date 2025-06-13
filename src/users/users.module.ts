import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserPreferencesModule } from 'src/user-preferences/user-preferences.module';
import { FriendshipsModule } from 'src/friendships/friendships.module';

@Module({
  imports: [
    forwardRef(() => UserPreferencesModule),
    forwardRef(() => FriendshipsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

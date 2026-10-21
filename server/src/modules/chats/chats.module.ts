import { Module } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase.guard';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';

@Module({
  controllers: [ChatsController],
  providers: [ChatsService, FirebaseAuthGuard],
})
export class ChatsModule {}
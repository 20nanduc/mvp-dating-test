import { Module } from '@nestjs/common';
import { ChatRoomController } from './chat-room.controller';
import { ChatRoomService } from './chat-room.service';
import { ChatRoomGateway } from './chat-room.gateway';

// FirebaseModule is already @Global() in the MVP-DATING backend.
@Module({
  controllers: [ChatRoomController],
  providers: [ChatRoomService, ChatRoomGateway],
})
export class ChatRoomModule {}

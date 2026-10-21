import { Module } from '@nestjs/common';
import { FirebaseModule } from './firebase/firebase.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DiscoveryModule } from "./modules/discovery/discovery.module";
import { ConnectionsModule } from './modules/connections/connections.module';
import { ChatsModule } from './modules/chats/chats.module';
import { ChatRoomModule } from './modules/chat-room/chat-room.module';


@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    FirebaseModule,
    UsersModule,
    AuthModule,
    DiscoveryModule,
    ConnectionsModule,
    ChatsModule,
    ChatRoomModule,
  ],
  controllers: [],
  providers: [],

})
export class AppModule {}

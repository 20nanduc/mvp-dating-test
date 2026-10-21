import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase.guard';
import { ChatsService } from './chats.service';

interface AuthenticatedRequest {
  user: { uid: string };
}

@UseGuards(FirebaseAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  getChats(@Req() req: AuthenticatedRequest) {
    return this.chatsService.getChats(req.user.uid);
  }

  @Get('unread-count')
  getUnreadChatsCount(@Req() req: AuthenticatedRequest) {
    return this.chatsService.getUnreadChatsCount(req.user.uid);
  }
}
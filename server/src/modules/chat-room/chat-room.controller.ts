import {
  Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards,
  UsePipes, ValidationPipe, UnauthorizedException,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase.guard';
import {
  CloseConnectionDto, DecideThoughtDto, ProposeThoughtDto,
  ReadRoomDto, SendChatMessageDto,
} from './dto/chat-room.dto';
import { ChatRoomService } from './chat-room.service';

interface AuthRequest { user?: { uid?: string } }

@Controller('chat-rooms')
@UseGuards(FirebaseAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class ChatRoomController {
  constructor(private readonly service: ChatRoomService) {}

  private uid(req: AuthRequest): string {
    if (!req.user?.uid) throw new UnauthorizedException();
    return req.user.uid;
  }

  @Get(':connectionId')
  getRoom(@Req() req: AuthRequest, @Param('connectionId') id: string) {
    return this.service.getRoom(this.uid(req), id);
  }

  @Get(':connectionId/messages')
  getMessages(
    @Req() req: AuthRequest,
    @Param('connectionId') id: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.service.getMessages(this.uid(req), id, limit, before);
  }

  @Post(':connectionId/messages')
  sendMessage(@Req() req: AuthRequest, @Param('connectionId') id: string, @Body() body: SendChatMessageDto) {
    return this.service.send(this.uid(req), id, body.roomId, body.clientMessageId, body.text, 'TEXT');
  }

  @Post(':connectionId/thoughts')
  proposeThought(@Req() req: AuthRequest, @Param('connectionId') id: string, @Body() body: ProposeThoughtDto) {
    return this.service.send(this.uid(req), id, body.roomId, body.clientMessageId, body.text, 'THOUGHT_PROPOSAL');
  }

  @Patch(':connectionId/thoughts/:messageId/decision')
  decideThought(
    @Req() req: AuthRequest,
    @Param('connectionId') id: string,
    @Param('messageId') messageId: string,
    @Body() body: DecideThoughtDto,
  ) {
    return this.service.decide(this.uid(req), id, body.roomId, messageId, body.decision);
  }

  @Post(':connectionId/read')
  markRead(@Req() req: AuthRequest, @Param('connectionId') id: string, @Body() body: ReadRoomDto) {
    return this.service.markRead(this.uid(req), id, body.roomId, body.lastSeenMessageId);
  }

  @Post(':connectionId/close')
  close(@Req() req: AuthRequest, @Param('connectionId') id: string, @Body() body: CloseConnectionDto) {
    return this.service.close(this.uid(req), id, body.roomId);
  }
}

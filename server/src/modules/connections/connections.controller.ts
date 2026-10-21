import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { CreateRequestDto } from './dto/create-request.dto';

import type { Request } from 'express';

import { FirebaseAuthGuard } from '../../common/guards/firebase.guard';
import { ConnectionsService } from './connections.service';

type AuthenticatedRequest = Request & {
  user: {
    uid: string;
  };
};

@Controller('connections')
@UseGuards(FirebaseAuthGuard)
export class ConnectionsController {
  constructor(
    private readonly connectionsService: ConnectionsService,
  ) { }

  // POST /connections/requests
  @Post('requests')
  createRequest(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRequestDto,
  ) {
    return this.connectionsService.createRequest(
      req.user.uid,
      dto.receiverId,
    );
  }

  // GET /connections/requests?type=received
  @Get('requests')
  getIncomingRequests(
    @Req() req: AuthenticatedRequest,
    @Query('type') type: string = 'received',
  ) {
    if (type !== 'received') {
      throw new BadRequestException(
        'Only received requests are supported',
      );
    }

    return this.connectionsService.getIncomingRequests(
      req.user.uid,
    );
  }

  // GET /connections/requests/count
  @Get('requests/count')
  getRequestsCount(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.connectionsService.getRequestsCount(
      req.user.uid,
    );
  }

  // PATCH /connections/requests/:id/accept
  @Patch('requests/:id/accept')
  acceptRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id') connectionId: string,
  ) {
    return this.connectionsService.decideRequest(
      connectionId,
      req.user.uid,
      'accept',
    );
  }

  // PATCH /connections/requests/:id/reject
  @Patch('requests/:id/reject')
  rejectRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id') connectionId: string,
  ) {
    return this.connectionsService.decideRequest(
      connectionId,
      req.user.uid,
      'reject',
    );
  }
}
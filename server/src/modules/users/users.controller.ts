import {
  Body,
  Controller,
  Post,
  Patch,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common';

import type { Request } from 'express';

import { UsersService } from './users.service';
import { CreateAccountDto } from './dto/create_account_dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase.guard';

type AuthenticatedRequest = Request & {
  user: { uid: string };
};

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('me/account')
  @HttpCode(200)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  createAccount(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAccountDto,
  ) {
    return this.usersService.createAccount(req.user.uid, dto);
  }


  @Patch('me/match')
  @UseGuards(FirebaseAuthGuard)
  async updateMatch(
    @Req() req: { user: { uid: string } },

    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    dto: UpdateMatchDto,
  ) {
    return this.usersService.updateMatch(req.user.uid, dto);
  }


}
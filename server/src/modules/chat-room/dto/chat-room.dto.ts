import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text!: string;

  @IsString()
  @MinLength(1)
  roomId!: string;

  @IsUUID('4')
  clientMessageId!: string;
}

export class ProposeThoughtDto {
  @IsString()
  @MinLength(1)
  @MaxLength(280)
  text!: string;

  @IsString()
  @MinLength(1)
  roomId!: string;

  @IsUUID('4')
  clientMessageId!: string;
}

export class DecideThoughtDto {
  @IsString()
  @MinLength(1)
  roomId!: string;

  @IsIn(['EXPLORE', 'REJECT'])
  decision!: 'EXPLORE' | 'REJECT';
}

export class ReadRoomDto {
  @IsString()
  @MinLength(1)
  roomId!: string;

  @IsString()
  @MinLength(1)
  lastSeenMessageId!: string;
}

export class CloseConnectionDto {
  @IsString()
  @MinLength(1)
  roomId!: string;
}

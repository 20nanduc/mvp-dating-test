import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  receiverId!: string;
}
import {
  IsArray,
  IsString,
  IsNotEmpty,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayUnique,
} from 'class-validator';

export class UpdateMatchDto {
  @IsString()
  @IsNotEmpty()
  profile_pic!: string;

  @IsString()
  @IsNotEmpty()
  profile_pic_thumb!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  interests!: string[];
}
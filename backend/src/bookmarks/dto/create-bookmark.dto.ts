import { IsString, IsUrl, IsOptional, IsArray } from 'class-validator';

export class CreateBookmarkDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];
}


import { IsString, IsUrl, IsOptional, IsArray } from 'class-validator';

export class UpdateBookmarkDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];
}


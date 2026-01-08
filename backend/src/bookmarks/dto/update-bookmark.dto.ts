import { IsString, IsOptional, IsArray } from 'class-validator';
import { IsValidUrl } from '../../common/validators/is-valid-url.validator';

export class UpdateBookmarkDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsValidUrl({ message: 'url must be a valid URL address' })
  url?: string;

  @IsOptional()
  @IsString()
  tabId?: string; // Keep for backward compatibility

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tabIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];
}

import { IsString, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsString()
  color: string;

  @IsOptional()
  @IsString()
  tabId?: string;
}

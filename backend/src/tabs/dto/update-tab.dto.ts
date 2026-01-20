import { IsString, IsOptional } from 'class-validator';

export class UpdateTabDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

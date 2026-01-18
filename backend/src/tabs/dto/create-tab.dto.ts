import { IsString, IsOptional } from 'class-validator';

export class CreateTabDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}



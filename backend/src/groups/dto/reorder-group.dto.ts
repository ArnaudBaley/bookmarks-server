import { IsNumber } from 'class-validator';

export class ReorderGroupDto {
  @IsNumber()
  newOrderIndex: number;
}

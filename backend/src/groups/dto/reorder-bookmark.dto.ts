import { IsNumber } from 'class-validator';

export class ReorderBookmarkDto {
  @IsNumber()
  newOrderIndex: number;
}

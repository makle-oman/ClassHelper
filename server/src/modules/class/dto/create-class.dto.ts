import { IsInt, Min, Max } from 'class-validator';

export class CreateClassDto {
  @IsInt()
  @Min(1)
  @Max(6)
  grade_number: number;

  @IsInt()
  @Min(1)
  class_number: number;
}

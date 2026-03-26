import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdateClassDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  grade_number?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  class_number?: number;
}

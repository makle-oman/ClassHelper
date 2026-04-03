import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

export class UpdateCourseDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  weekday?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  period?: number;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  room?: string;
}

import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateCourseDto {
  @IsInt()
  class_id: number;

  @IsInt()
  semester_id: number;

  @IsInt()
  @Min(1)
  @Max(7)
  weekday: number;

  @IsInt()
  @Min(1)
  period: number;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  room?: string;
}

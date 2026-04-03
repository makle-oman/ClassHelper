import { IsInt, IsArray, ValidateNested, IsString, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CourseItemDto {
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

export class BatchCreateCourseDto {
  @IsInt()
  class_id: number;

  @IsInt()
  semester_id: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseItemDto)
  items: CourseItemDto[];
}

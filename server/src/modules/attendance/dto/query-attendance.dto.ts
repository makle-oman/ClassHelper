import { IsInt, IsOptional, IsDateString } from 'class-validator';

export class QueryAttendanceListDto {
  @IsInt()
  class_id: number;

  @IsDateString()
  date: string;
}

export class QueryStudentStatsDto {
  @IsInt()
  student_id: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}

export class QueryClassStatsDto {
  @IsInt()
  class_id: number;

  @IsDateString()
  date: string;
}

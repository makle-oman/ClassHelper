import { IsInt, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateLeaveDto {
  @IsInt()
  student_id: number;

  @IsInt()
  class_id: number;

  @IsOptional()
  @IsInt()
  parent_id?: number;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsString()
  reason: string;
}
